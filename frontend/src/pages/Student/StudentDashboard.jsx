/**
 * file: frontend/src/pages/Student/StudentDashboard.jsx
 * description: Dashboard page for student users
 */

import StudentNavBar from '../../components/NavBars/StudentNavBar'
import Dashboard from '../Dashboard/Dashboard.jsx'

const buttons = [
    { label: 'Degree Tracking', path: '/student/degree-tracking' },
    { label: 'Settings', path: '/student/settings' },
];

/**
 * StudentDashboard component displays the main dashboard for students with navigation options.
 *
 * @component
 * @returns {JSX.Element} The main dashboard view for students
 */
export default function StudentDashboard() {
    
    return (
        <Dashboard
            NavBar={StudentNavBar}
            pageTitle="Student Homepage"
            buttons={buttons}
        />
    )
}
