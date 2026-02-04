import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/images/boise_state_wbg.png'
import '../../styles/Styles.css'
import { Bell } from 'lucide-react'
import LogoutButton from '../LogoutButton.jsx'
import NotifButton from '../NotifButton.jsx'

/**
 * StudentNavBar component renders the navigation bar for student users.
 * It includes a back button that navigates to the student dashboard and displays the BSU logo.
 *
 * @component
 * @returns {JSX.Element} The rendered student navigation bar.
 */
export default function StudentNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/student/dashboard';

  {/* Display the Student navigation bar */}
  return (
    <div className='navbar'>
      <div className='navbar-left'>
        {showBackButton && (
        <div style={{ position: 'absolute', left: '20px' }}>
          <button onClick={() => navigate('/student/dashboard')} className='back-button'>←</button>
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
