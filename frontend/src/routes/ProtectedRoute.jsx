/**
 * file: frontend/src/routes/ProtectedRoute.jsx
 * description: Protects API routes from being accessed by unauthorized users
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

/**
 * @file frontend/src/routes/ProtectedRoute.jsx
 * @description Protects API routes from being accessed by unauthorized users
 *              Users without required permissions are rejected from accessing certain routes
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
const ROLE_NAME_BY_ID = {
    1: "admin",
    2: "advisor",
    3: "student",
    4: "accounting",
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
    if (dv !== undefined && dv !== null) {
        const asNumber = typeof dv === "number" ? dv : Number(dv);
        if (!Number.isNaN(asNumber) && DASHBOARD_BY_ROLE_ID[asNumber]) {
            return DASHBOARD_BY_ROLE_ID[asNumber];
        }

        if (typeof dv === "string" && DASHBOARD_BY_ROLE_NAME[dv]) {
            return DASHBOARD_BY_ROLE_NAME[dv];
        }
    }

    // Default view doesn't exist, find by role
    if (user.role && DASHBOARD_BY_ROLE_NAME[user.role]) {
        return DASHBOARD_BY_ROLE_NAME[user.role];
    }

    // Fallback
    return "/student/dashboard";
}

/**
 * Protected route component that checks if the user is authenticated.
 * If authenticated, it renders the child components (Outlet).
 * If not authenticated, it redirects to the login page.
 *
 * @returns {JSX.Element} The protected route component.
 */
export default function ProtectedRoute({ allowedRoles }) {
    const { isAuthed, user } = useAuth();
    const location = useLocation();
    
    // Block access if not authenticated
    if (!isAuthed) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Unprotected route
    if (!allowedRoles || allowedRoles.length === 0) {
        return <Outlet />;
    }

    // Check if user is allowed to access certain routes based on roles
    const primaryRole = user?.role?.toLowerCase();
    let defaultRoleName;

    // Find the user's default view
    const userDefaultView = user?.default_view;
    if (userDefaultView !== undefined && userDefaultView !== null) {
        const asNumber = typeof userDefaultView === "number" ? userDefaultView : Number(userDefaultView);
        if (!Number.isNaN(asNumber) && ROLE_NAME_BY_ID[asNumber]) {
            defaultRoleName = ROLE_NAME_BY_ID[asNumber].toLowerCase();
        }
    }

    const effectiveRoles = [primaryRole, defaultRoleName].filter(Boolean);
    const allowed = allowedRoles.map((r) => r.toLowerCase());

    // Check what routes user can access
    const isAllowed = effectiveRoles.some((r) => allowed.includes(r));

    if (!isAllowed) {
        const fallbackPath = getHomeRoute(user);
        return <Navigate to={fallbackPath} replace />;
    }

    return <Outlet />;
}