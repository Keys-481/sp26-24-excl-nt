import { useNavigate, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import logo from '../../assets/images/boise_state_wbg.png'
import '../../styles/Styles.css'
import LogoutButton from '../LogoutButton.jsx'
import NotifButton from '../NotifButton.jsx'

/**
 * AccountingNavBar component renders the navigation bar for accounting users.
 * It includes a back button that navigates to the accounting dashboard and displays the BSU logo.
 *
 * @component
 * @returns {JSX.Element} The rendered accounting navigation bar.
 */
export default function AccountingNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/accounting/dashboard';

  {/* Display the Accounting navigation bar */}
  return (
    <div className='navbar'>
      <div className='navbar-left'>
        {showBackButton && (
        <div style={{ position: 'absolute', left: '20px' }}>
          <button onClick={() => navigate('/accounting/dashboard')} className='back-button'>←</button>
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
