/**
 * file: frontend/src/pages/Advisor/Settings.jsx
 * description: Settings page for advisor users to manage profile, password, views, and preferences.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdvisorNavBar from '../../components/NavBars/AdvisorNavBar';
import { useApiClient } from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthProvider';

/**
 * AdvisorSettings component displays the Settings page for advisor users.
 * It allows users to view and update their profile information, change their password,
 * switch between different role-based views, and view assigned advisor information.
 *
 * @component
 * @returns {JSX.Element} A React component rendering the advisor settings interface.
 */
export default function AdvisorSettings() {
  const navigate = useNavigate();
  const { user, setRole } = useAuth();
  const [viewType, setViewType] = useState('settings'); // Default to 'settings'
  const [userInfo, setUserInfo] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdateStatus, setPasswordUpdateStatus] = useState(null);
  const [newView, setNewView] = useState('');
  const [viewUpdateStatus, setViewUpdateStatus] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('0px');
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const api = useApiClient();
  const roleSettingsRoutes = {
    admin: '/admin/settings',
    student: '/student/settings',
    advisor: '/advisor/settings',
    accounting: '/accounting/settings'
  };

  /**
   * useEffect hook to fetch current user info and advisor relationships on component mount.
   * Sets userInfo, default view, and advisor list if applicable.
   */
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/users/me');
        setUserInfo(data);
        setNewView(data.default_view);

        // Fetch preferences separately
        const prefs = await api.get(`/users/${data.user_id}/preferences`);
        if (prefs) {
          setTheme(prefs.theme);
          setFontSize(prefs.font_size_change);
          setFontFamily(prefs.font_family);
          setIsDark(prefs.theme === 'dark');

          setIsDark(prefs.theme === 'dark'); // set state
          document.body.classList.toggle('dark-theme', prefs.theme === 'dark');
          document.documentElement.style.setProperty('--font-size-change', prefs.font_size_change);
          document.documentElement.style.setProperty('--font-family-change', prefs.font_family);
        }


        // Fetch advisor info
        const advisingData = await api.get(`/users/${data.user_id}/advising`);
        if (advisingData?.advisors?.length > 0) {
          setAdvisors(advisingData.advisors);
        }
      } catch (error) {
        console.error('Failed to fetch user info or advising data:', error);
      }
    })();
  }, []);

  if (!userInfo) return <p>Loading user info...</p>;

  // Render the settings page
  return (
    <div>
      {/* Navigation Bar */}
      <AdvisorNavBar />
      <div className='window'>
        <div className='title-bar'>
          <h1>Settings</h1>
          <div className='container'>
            <div className="view-toggle">
              <div>
                <button
                  onClick={() => setViewType('profile')}
                  className={viewType === 'profile' ? 'active' : 'inactive'}
                >
                  Profile
                </button>
                <button
                  onClick={() => setViewType('settings')}
                  className={viewType === 'settings' ? 'active' : 'inactive'}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="view-content">
              {viewType === 'profile' && (
                <div>
                  <h2 style={{ marginLeft: '15px' }}>Personal Information</h2>
                  <div className='horizontal-line'></div>
                  <div className="textbox-row">
                    <p><strong>Name:</strong> {userInfo.name}</p>
                  </div>
                  <div className="textbox-row">
                    <p><strong>ID:</strong> {userInfo.id}</p>
                  </div>
                  <div className="textbox-row">
                    <p><strong>Email:</strong> {userInfo.email}</p>
                  </div>
                  <div className="textbox-row">
                    <p><strong>Phone:</strong> {userInfo.phone}</p>
                  </div>
                  <div className="textbox-row">
                    <p><strong>Change Password:</strong></p>
                    <input
                      className="textbox"
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/users/${userInfo.user_id}/password`, {
                            password: newPassword
                          });
                          setPasswordUpdateStatus('Password updated successfully.');
                          setNewPassword('');
                        } catch (err) {
                          console.error('Password update failed:', err);
                          setPasswordUpdateStatus('Failed to update password.');
                        }
                      }}
                    >
                      Update
                    </button>
                    {passwordUpdateStatus && <p>{passwordUpdateStatus}</p>}
                  </div>

                  {/* Display user roles if they have more than 1 */}
                  {userInfo.roles?.length > 1 && (
                    <>
                      <h2 style={{ marginLeft: '15px', marginTop: '20px' }}>Roles</h2>
                      <div className='horizontal-line'></div>
                      <ul>
                        {userInfo.roles.map((role, index) => (
                          <li key={index}>{role}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* Display user advisor information if they have one*/}
                  {advisors.length > 0 && (
                    <>
                      <h2 style={{ marginLeft: '15px', marginTop: '20px' }}>Advisor Information</h2>
                      <div className='horizontal-line'></div>
                      {advisors.map((advisor, index) => (
                        <div key={index}>
                          <div className="textbox-row">
                            <p><strong>Name:</strong> {advisor.name}</p>
                          </div>
                          <div className="textbox-row">
                            <p><strong>Email:</strong> {advisor.email}</p>
                          </div>
                          <div className="textbox-row">
                            <p><strong>Phone:</strong> {advisor.phone_number}</p>
                          </div>
                          <div className="horizontal-line-half"></div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              {viewType === 'settings' && (
                <div>
                  {/* If user has more than 1 role display */}
                  {userInfo.roles?.length > 1 && (
                    <div>
                      <div className="textbox-row">
                        <p><strong>Current View:</strong> {user?.role}</p>
                      </div>
                      <div className="textbox-row">
                        <p><strong>Change View:</strong></p>
                        <select
                          className="textbox"
                          value={newView}
                          onChange={(e) => setNewView(e.target.value)}
                        >
                          {userInfo.roles.map((role, index) => (
                            <option key={index} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const targetRole = newView.toLowerCase();

                            // Update current role in Auth
                            setRole(targetRole);

                            const route = roleSettingsRoutes[targetRole];
                            if (route) {
                              navigate(route);
                            } else {
                              console.warn('No route defined for role:', newView);
                            }
                          }}
                        >
                          Switch View
                        </button>
                      </div>

                      {viewUpdateStatus && <p>{viewUpdateStatus}</p>}
                      <div className='horizontal-line'></div>
                    </div>
                  )}

                  {/* Generic Settings */}

                  <div>
                    {/* Theme Toggle */}
                    <div className="toggle-row">
                      <p><strong>Dark Theme:</strong></p>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={theme === 'dark'}
                          onChange={async (e) => {
                            const newTheme = e.target.checked ? 'dark' : 'light';
                            setTheme(newTheme);
                            document.body.classList.toggle('dark-theme', newTheme === 'dark');
                            try {
                              await api.put(`/users/${userInfo.user_id}/preferences`, {
                                theme: newTheme,
                                font_size_change: fontSize,
                                font_family: fontFamily
                              });
                            } catch (err) {
                              console.error('Theme update failed:', err);
                            }
                          }}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {/* Font Size Selector */}
                    <div className="textbox-row">
                      <p><strong>Font Size:</strong></p>
                      <select
                        className="textbox"
                        value={fontSize}
                        onChange={async (e) => {
                          const size = e.target.value;
                          setFontSize(size);
                          document.documentElement.style.setProperty('--font-size-change', size);
                          try {
                            await api.put(`/users/${userInfo.user_id}/preferences`, {
                              theme,
                              font_size_change: size,
                              font_family: fontFamily
                            });
                          } catch (err) {
                            console.error('Font size update failed:', err);
                          }
                        }}
                      >
                        <option value="-2px">Small</option>
                        <option value="0px">Medium</option>
                        <option value="4px">Large</option>
                      </select>
                    </div>

                    {/* Font Family Selector */}
                    <div className="textbox-row">
                      <p><strong>Font Family:</strong></p>
                      <select
                        className="textbox"
                        value={fontFamily}
                        onChange={async (e) => {
                          const family = e.target.value;
                          setFontFamily(family);
                          document.documentElement.style.setProperty('--font-family-change', family);
                          try {
                            await api.put(`/users/${userInfo.user_id}/preferences`, {
                              theme,
                              font_size_change: fontSize,
                              font_family: family
                            });
                          } catch (err) {
                            console.error('Font family update failed:', err);
                          }
                        }}
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Courier New', monospace">Courier</option>
                        <option value="'Times New Roman', serif">Times</option>
                        <option value="'Segoe UI', sans-serif">Segoe UI</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
