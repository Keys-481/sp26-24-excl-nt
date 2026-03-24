import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/boise_state_wbg.png'
import { useAuth } from '../../auth/AuthProvider.jsx'
import '../../styles/Styles.css'
import ErrorMessage from '../../components/ErrorMessage.jsx'

/**
 * @file frontend/src/pages/LogIn/LogIn.jsx
 * @description Login page for SDP website.
 *              Authenticates users when given valid credentials and sends them to their dashboard.
 *              Rejects invalid credentials.
 */


// Helper mappings
const DASHBOARD_BY_ROLE_ID = {
    1: "/admin/dashboard",
    2: "/advisor/dashboard",
    3: "/student/dashboard",
    4: "/accounting/dashboard",
};
const DASHBOARD_BY_ROLE_NAME = {
    admin: "/admin/dashboard",
    advisor: "/advisor/dashboard",
    student: "/student/dashboard",
    accounting: "/accounting/dashboard",
};

/**
 * Gets a users home route based on their default view.
 * Falls back to a user's role if default view is unspecified.
 * @param {*} user The current user
 * @returns The current user's home route
 */
function getHomeRoute(user) {
    if (!user) return "/student/dashboard";

    const dv = user.default_view;

    // Default view exists in database
    if (dv !== undefined && dv !== null){
        const asNumber = typeof dv === 'number' ? dv : Number(dv);
        if (!Number.isNaN(asNumber) && DASHBOARD_BY_ROLE_ID[asNumber]) {
            return DASHBOARD_BY_ROLE_ID[asNumber];
        }

        // Default view is a string
        if (typeof dv === 'string' && DASHBOARD_BY_ROLE_NAME[dv]) {
            return DASHBOARD_BY_ROLE_NAME[dv];
        }
    }

    // Default view doesn't exist, find by role
    if (user.role && DASHBOARD_BY_ROLE_NAME[user.role]) {
        return DASHBOARD_BY_ROLE_NAME[user.role];
    }

    return "/student/dashboard";
}

/// Login component
export default function LogIn() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [resendEmail, setResendEmail] = useState("");
    const [resendMessage, setResendMessage] = useState("");
    const [resendError, setResendError] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const { isAuthed, login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (!isAuthed) return;
        const home = getHomeRoute(user);
        navigate(home, { replace: true });
    }, [isAuthed, user, navigate]);

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/login`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });

            if (!res.ok) {
                setError("Invalid credentials. Please try again.");
                return;
            }

            // Successful login
            const data = await res.json();
            login({ token: data.token, user: data.user });

            // Redirect to intended page or default home
            const from = location.state?.from?.pathname;
            const defaultHome = getHomeRoute(data.user);

            // Determine destination
            const dest = (from && from !== "/login") ? from : defaultHome;
            navigate(dest, { replace: true });
        } catch {
            setError("Unable to log in. Try again.");
        }
    }

    async function handleResendLoginEmail(e) {
        e.preventDefault();
        setResendMessage("");
        setResendError("");
        setResendLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/resend-login-email`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: resendEmail.trim() }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setResendMessage(data.message || "Request processed.");
            } else {
                setResendError(data.error || "Could not resend login instructions. Try again.");
            }
        } catch {
            setResendError("Could not resend login instructions. Try again.");
        } finally {
            setResendLoading(false);
        }
    }

    // Render login form
    return (
        <main className="page-wrapper"> 
        {/* Navbar with logo */}
            <div className='navbar'>
                <img src={logo} alt="BSU-Logo" style={{ height: '45px', alignItems: 'center', top: '-3px' }} />
            </div>

            {/* Login form window */}
            <div className="window login-body">
                <div className="login-card">
                    <h1 className="login-title">Log In</h1>

                    {/* Login form */}
                    <form onSubmit={handleSubmit} data-testid="login-form" className="login-form">
                        <label>
                            Email or Phone Number
                            <input
                                data-testid="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="example@email.com"
                            />
                        </label>

                        {/* Password input */}
                        <label>
                            Password
                            <input
                                data-testid="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </label>

                        {error && (
                            <ErrorMessage variant="login" message={error} dataTestId="error" />
                        )}

                        <button type="submit" data-testid="submit">Log In</button>
                    </form>

                    <details className="login-resend" style={{ marginTop: "1.25rem" }}>
                        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            Didn&apos;t receive login instructions?
                        </summary>
                        <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                            Check your <strong>spam</strong> folder. You can resend login instructions to your
                            Boise State email below.
                        </p>
                        <form
                            onSubmit={handleResendLoginEmail}
                            className="login-form"
                            data-testid="resend-login-form"
                            style={{ marginTop: "0.5rem" }}
                        >
                            <label>
                                Boise State email
                                <input
                                    data-testid="resend-email"
                                    type="email"
                                    value={resendEmail}
                                    onChange={(e) => setResendEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="you@u.boisestate.edu"
                                />
                            </label>
                            {resendMessage && (
                                <p data-testid="resend-success" style={{ color: "var(--success-color, #1b5e20)" }}>
                                    {resendMessage}
                                </p>
                            )}
                            {resendError && (
                                <ErrorMessage variant="login" message={resendError} dataTestId="resend-error" />
                            )}
                            <button type="submit" data-testid="resend-submit" disabled={resendLoading}>
                                {resendLoading ? "Sending…" : "Resend login instructions"}
                            </button>
                        </form>
                    </details>
                </div>
            </div>
        </main>
    )
}