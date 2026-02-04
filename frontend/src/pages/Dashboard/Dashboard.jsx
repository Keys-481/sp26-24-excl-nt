/**
 * @file frontend/src/pages/Dashboard/Dashboard.jsx
 * @description Dashboard Component to direct users to different sections based on their role
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import StudentNavBar from '../../components/NavBars/StudentNavBar'
import { useApiClient } from '../../lib/apiClient'
import sdpLogo from '../../assets/images/sdp-logo-3.png'
import '../../styles/Styles.css'


export default function Dashboard({ NavBar, pageTitle, buttons }) {
    const navigate = useNavigate()
    const { logout } = useAuth();
    const api = useApiClient();

    /**
     * useEffect hook that runs each time the Dashboard component mounts.
     */
    useEffect(() => {
        (async () => {
            try {
                const me = await api.get("/users/me");
                const prefs = me.preferences;
                if (prefs) {
                    document.body.classList.toggle("dark-theme", prefs.theme === "dark");
                    document.documentElement.style.setProperty("--font-size-change", prefs.font_size_change);
                    document.documentElement.style.setProperty("--font-family-change", prefs.font_family);
                }
            } catch (err) {
                console.error("Failed to apply preferences:", err);
            }
        })();
    }, []);
    
    return (
        <div>
            {/* Navigation bar */}
            <NavBar />

            <div className="sdp-logo">
                <img src={sdpLogo} alt="SDP Logo" />
            </div>

            <div className='window'>
                {/* Page Title */}
                <div className='title-bar'>
                    <h1>{pageTitle}</h1>
                </div>

                {/*  Main Content Area with Navigation Buttons */}
                <div className='container'>
                    <div className='dashboard-container'>
                        <div className='button-row'>
                            {buttons.map((button) => (
                                <button
                                    key={button.path}
                                    className='square-button'
                                    onClick={() => navigate(button.path)}
                                >
                                    {button.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
