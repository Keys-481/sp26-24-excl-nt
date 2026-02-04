import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/images/boise_state_wbg.png'
import { Bell } from 'lucide-react'
import '../../styles/Styles.css'
import LogoutButton from '../LogoutButton.jsx'
import NotifButton from '../NotifButton.jsx'

export default function AdvisorNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const showBackButton = location.pathname !== '/advisor/dashboard';

  {/* Display the Advisor navigation bar */}
  return (
    <div className='navbar'>
      <div className='navbar-left'>
        {showBackButton && (
        <div style={{ position: 'absolute', left: '20px' }}>
          <button onClick={() => navigate('/advisor/dashboard')} className='back-button'>←</button>
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
