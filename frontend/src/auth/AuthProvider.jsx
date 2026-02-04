/**
 * Authentication Provider using React Context API.
 * Manages user authentication state, login, logout, and idle timeout functionality.
 * Persists authentication state in localStorage.
 *
 * @file frontend/src/auth/AuthProvider.jsx
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import TimeoutPopup from "../components/TimeoutPopup";

// Config (change to shorter time when testing)
// Milliseconds (in a second) * seconds (in a minute) * minutes
const IDLE_TIME_MS = 1000 * 60 * 30; // Use this for testing: 1000 * 20;
const WARNING_TIME_MS = 1000 * 60 * 25; // Use this for testing: 1000 * 5;
const COUNTDOWN = Math.ceil((IDLE_TIME_MS - WARNING_TIME_MS) / 1000);
const ALLOW_CROSS_TAB_REMOVE_WARNING = false;

const STORAGE = {
    AUTH: "auth",
    LAST_ACTIVITY: "lastActivityTs", // milliseconds
    LOGOUT_REASON: "logoutReason",
};

/**
 * Resets all user interface preferences back to default values.
 *
 * @function resetPreferences
 * @returns {void} Performs DOM side effects; does not return a value.
 */
function resetPreferences() {
    document.body.classList.remove("dark-theme");
    document.documentElement.style.setProperty("--font-size-change", "0px");
    document.documentElement.style.setProperty("--font-family-change", "Arial, sans-serif");
}

const AuthContext = createContext(null);
const now = () => Date.now();

/**
 * Provider component to manage authentication state and provide it to child components.
 * Persists into `localStorage` under the key `"auth"`.
 * 
 * @param {{ children: React.ReactNode }} props - The props object containing child components.
 * @returns {JSX.Element} The AuthProvider component wrapping its children with AuthContext.
 */
export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => {
        const raw = localStorage.getItem(STORAGE.AUTH);
        return raw ? JSON.parse(raw) : { isAuthed: false, token: null, user: null };
    });

    const isAuthed = !!auth?.isAuthed;

    // Idle warning state and timers
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN);
    const warnTimerRef = useRef(null);
    const logoutTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const deadlineRef = useRef(null);
    const warnAtRef = useRef(null);
    const showWarningRef = useRef(false);

    // Persist auth
    useEffect(() => {
        localStorage.setItem(STORAGE.AUTH, JSON.stringify(auth));
    }, [auth]);

    // Persist warning
    useEffect(() => {
        showWarningRef.current = showWarning;
    }, [showWarning]);

    // Helper method that reads last user activity
    const getLastActivity = () => {
        const time = localStorage.getItem(STORAGE.LAST_ACTIVITY);
        return time ? Number(time) : null;
    }
    // Helper method that sets last user activity
    const setLastActivity = (ts = now()) => {
        localStorage.setItem(STORAGE.LAST_ACTIVITY, String(ts));
        return ts;
    }
    // Helper method that clears all timers
    const clearTimers = () => {
        clearTimeout(warnTimerRef.current);
        clearTimeout(logoutTimerRef.current);
        clearInterval(countdownIntervalRef.current);
    }

    // Schedule timers based on activity
    const scheduleTimers = (lastTs) => {
        clearTimers();

        // absolute times
        deadlineRef.current = lastTs + IDLE_TIME_MS;
        warnAtRef.current = lastTs + WARNING_TIME_MS;

        const nowMs = Date.now();
        const untilWarn = Math.max(0, warnAtRef.current - nowMs);
        const untilLogout = Math.max(0, deadlineRef.current - nowMs);

        if (untilLogout === 0) {
            logout("timeout");
            return;
        }

        // Warns the user after reaching warn threshold
        warnTimerRef.current = setTimeout(() => {
            setShowWarning(true);

            // Start countdown
            const remainNow = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
            setCountdown(remainNow);

            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = setInterval(() => {
                const remain = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
                setCountdown(remain);
                if (remain <= 0) clearInterval(countdownIntervalRef.current);
            }, 1000);
        }, untilWarn);

        // Logs out after reaching logout threshold
        logoutTimerRef.current = setTimeout(() => {
            logout("timeout");
        }, untilLogout);
    };

    // Mark user as active and reset timers/warnings
    const markActivity = ({ force = false } = {}) => {
        if (!isAuthed) return;

        // Prevent activity from removing warning
        if (showWarningRef.current && !force) return;

        setShowWarning(false);
        clearInterval(countdownIntervalRef.current);
        const ts = setLastActivity();
        scheduleTimers(ts);
    }

    // Set up user input listeners
    useEffect(() => {
        if (!isAuthed) {
            clearTimers();
            return;
        }

        const userActive = getLastActivity();
        const startFrom = userActive ?? setLastActivity();
        scheduleTimers(startFrom);

        const onAny = () => markActivity();
        const onVisibility = () => {
            if (document.visibilityState === "visible") onAny();
        };

        // Event listeners
        const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
        events.forEach((e) => window.addEventListener(e, onAny, { passive: true }));
        document.addEventListener("visibilitychange", onVisibility);

        // Cross-tab setup to detect lastActivity or logout from a different tab
        const onStorage = (e) => {
            // Another tab is logged in
            if (e.key === STORAGE.LAST_ACTIVITY && isAuthed) {
                // Prevent cross-tab activities from hiding the warning
                if (showWarningRef.current && !ALLOW_CROSS_TAB_REMOVE_WARNING) return;
                const last = getLastActivity();
                if (last) scheduleTimers(last);
            }
            // Another tab is logged out
            if (e.key === STORAGE.AUTH && !e.newValue && isAuthed) {
                setAuth({ isAuthed: false, token: null, user: null });
                window.location.href = "/login";
            }
        };
        window.addEventListener("storage", onStorage);

        return () => {
            events.forEach((e) => window.removeEventListener(e, onAny));
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("storage", onStorage);
            clearTimers();
        };
    }, [isAuthed]);

    // Login functionality
    const login = ({ token, user }) => {
        setAuth({ isAuthed: true, token, user });
        setLastActivity();
    };

    // Logout functionality with optional reason
    const logout = (reason = "") => {
        localStorage.setItem(STORAGE.LOGOUT_REASON, reason || "timeout");
        setAuth({ isAuthed: false, token: null, user: null });
        setShowWarning(false);
        resetPreferences();
        clearTimers();
        window.location.href = "/login";
    }

    // Functionality to update user role for logged-in user
    const setRole = (role) => {
        setAuth((prev) => {
            if (!prev || !prev.user) return prev;

            return {
                ...prev,
                user: {
                    ...prev.user,
                    role,
                },
            };
        });

        setLastActivity();
    }

    const handleStay = () => {
        // Allow button to remove warning
        markActivity({ force: true });
    }

    const value = useMemo(() => ({
        isAuthed: auth.isAuthed,
        user: auth.user,
        token: auth.token,
        login,
        logout,
        setRole,
    }), [auth]);

    // Render provider with timeout popup
    return (
        <AuthContext.Provider value={value}>
            {children}
            <TimeoutPopup
                visible={showWarning && isAuthed}
                secondsLeft={countdown}
                onStay={handleStay}
            />
        </AuthContext.Provider>
    );
}

/**
 * Custom hook to access the authentication context.
 * Should be used within components wrapped by AuthProvider.
 * 
 * @returns The authentication context value.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}