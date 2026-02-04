import { useNavigate, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import logo from '../../assets/images/boise_state_wbg.png'
import '../../styles/Styles.css'
import LogoutButton from '../LogoutButton.jsx'
import NotifButton from '../NotifButton.jsx'

/**
 * AdminNavBar component displays a top navigation bar for admin pages that  
 * are not the dashboard. It includes a back arrow button that navigates to 
 * the admin dashboard, and a title indicating the current page.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display in the navigation bar
 * @returns {JSX.Element} A styled navigation bar with a back button and title
 */
export default function AdminNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/admin/dashboard';

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        {showBackButton && (
        <div style={{ position: 'absolute', left: '20px' }}>
          <button onClick={() => navigate('/admin/dashboard')} className='back-button'>←</button>
        </div>
      )}
      </div>
      
      <img src={logo} alt="BSU-Logo" className='logo'/>

      <div className='navbar-right'>
        <div>
          <NotifButton />
        </div>

        <div>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
