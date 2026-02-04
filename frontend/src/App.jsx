/**
 * Root application component.
 * Serves as the entry point for routing logic by rendering AppRoutes,
 * which defines all the available routes in the application.
 *
 * @component
 * @returns {JSX.Element} The main application layout with route handling
 */
import { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { useApiClient } from './lib/apiClient';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const api = useApiClient();
  const { user } = useAuth(); // current authenticated user
  const [userInfo, setUserInfo] = useState(null);

  /**
   * useEffect hook that runs whenever the authenticated `user` logs out or
   * refreshes the page.
   */
  useEffect(() => {
    if (!user) {
      // If logged out, reset DOM to defaults
      document.body.classList.remove('dark-theme');
      document.documentElement.style.setProperty('--font-size-change', '0px');
      document.documentElement.style.setProperty('--font-family-change', 'Arial, sans-serif');
      setUserInfo(null);
      return;
    }

    (async () => {
      try {
        // Fetch current user info
        const data = await api.get('/users/me');
        setUserInfo(data);

        // Apply preferences directly from /me response
        const prefs = data.preferences;
        if (prefs) {
          document.body.classList.toggle('dark-theme', prefs.theme === 'dark');
          document.documentElement.style.setProperty('--font-size-change', prefs.font_size_change);
          document.documentElement.style.setProperty('--font-family-change', prefs.font_family);
        }
      } catch (err) {
        console.error('Failed to fetch user info or preferences:', err);
      }
    })();
  }, [user]);

  return <AppRoutes userInfo={userInfo} />;
}
