/**
 * @file frontend/src/components/logoutbutton
 * @description Provides a logout button that logs a user out of an active session
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function LogoutButton() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    /**
     * Logs the user out of the current session, even if any errors arise
     */
    async function handleLogout() {
        try {
            logout();
            navigate('/login', { replace: true });
        } catch (e) {
            logout();
            navigate('/login', { replace: true });
        }
    }

    return (
        <button
            onClick={handleLogout}
            className="logout-button"
            aria-label="Log out"
            title="Log out"
        >
            Logout
        </button>
    );
}