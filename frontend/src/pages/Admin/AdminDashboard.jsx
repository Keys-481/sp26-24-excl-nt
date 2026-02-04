/**
 * @file frontend/src/pages/admin/dashboard
 * @description Dashboard for admin users
 */

import AdminNavBar from '../../components/NavBars/AdminNavBar'
import Dashboard from '../Dashboard/Dashboard.jsx'

const buttons = [
  { label: 'Courses', path: '/admin/courses' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Enrollment Report', path: '/admin/reporting-functionality' },
  { label: 'Graduation Report', path: '/admin/graduation-report' },
  { label: 'Settings', path: '/admin/settings' }
];

/**
 * Dashboard component for the Admin role.
 * Displays a top navigation bar and a grid of square buttons
 * that link to the different admin sections: Courses, Users, and Settings.
 *
 * @component
 * @returns {JSX.Element} A styled admin dashboard with navigation buttons
 */
export default function AdminDashboard() {

  return (
    <Dashboard
      NavBar={AdminNavBar}
      pageTitle="Admin Homepage"
      buttons={buttons}
    />
  )
}
