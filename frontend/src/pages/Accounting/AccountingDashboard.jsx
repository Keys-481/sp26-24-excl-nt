/**
 * @file frontend/src/pages/accounting/dashboard
 * @description Dashboard for accounting users
 */

import AccountingNavBar from '../../components/NavBars/AccountingNavBar'
import Dashboard from '../Dashboard/Dashboard.jsx'

const buttons = [
    { label: 'Graduation Report', path: '/accounting/graduation-report' },
    { label: 'Enrollment Report', path: '/accounting/reporting-functionality' },
    { label: 'Settings', path: '/accounting/settings' }
];

/**
 * AccountingDashboard component displays the main dashboard for accounting with navigation options.
 *
 * @component
 * @returns {JSX.Element} The main dashboard view for accounting
 */
export default function AccountingDashboard() {

    return (
        <Dashboard
            NavBar={AccountingNavBar}
            pageTitle="Accounting Homepage"
            buttons={buttons}
        />
    )
}