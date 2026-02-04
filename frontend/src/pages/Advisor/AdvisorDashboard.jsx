/**
 * file: frontend/src/pages/Advisor/AdvisorDashboard.jsx
 * @description Dashboard for advisor users
 */

import AdvisorNavBar from '../../components/NavBars/AdvisorNavBar.jsx';
import Dashboard from '../Dashboard/Dashboard.jsx';

const buttons = [
    { label: 'Advising', path: '/advisor/advising' },
    { label: 'Enrollment Report', path: '/advisor/reporting-functionality' },
    { label: 'Settings', path: '/advisor/settings' },
];

/**
 * AdvisorDashboard component displays the main dashboard for advisors with navigation options.
 *
 * @component
 * @returns {JSX.Element} The main dashboard view for advisors
 */
export default function AdvisorDashboard() {
    return (
        <Dashboard
            NavBar={AdvisorNavBar}
            pageTitle="Advisor Homepage"
            buttons={buttons}
        />
    )
}
