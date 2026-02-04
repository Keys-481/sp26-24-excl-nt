/**
 * AppRoutes component defines all the route mappings for the application.
 * It uses React Router to handle navigation between different role-based pages.
 *
 * @component
 * @returns {JSX.Element} A router configuration with defined routes for Admin, Student, Advisor, and Accounting roles
 */

import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

//authentication import
import { AuthProvider } from '../auth/AuthProvider.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

//login import
import LogIn from '../pages/LogIn/LogIn.jsx'

//notifications import
import Notifications from '../pages/Notifications.jsx'

//admin imports
import AdminDashboard from '../pages/Admin/AdminDashboard.jsx'
import AdminCourses from '../pages/Admin/Courses'
import AdminGraduationReport from '../pages/Admin/GraduationReport'
import AdminSettings from '../pages/Admin/Settings'
import AdminEnrollmentReport from '../pages/Admin/ReportingFunctionality'
import AdminUsers from '../pages/Admin/Users'

//student imports
import StudentDegreeTracking from '../pages/Student/DegreeTracking'
import StudentSettings from '../pages/Student/Settings'
import StudentDashboard from '../pages/Student/StudentDashboard.jsx'

//advisor imports
import Advising from '../pages/Advisor/Advising'
import AdvisorDashboard from '../pages/Advisor/AdvisorDashboard.jsx'
import AdvisorReportingFunctionality from '../pages/Advisor/ReportingFunctionality'
import AdvisorSettings from '../pages/Advisor/Settings'

//accounting imports
import AccountingDashboard from '../pages/Accounting/AccountingDashboard.jsx'
import AccountingGraduationReport from '../pages/Accounting/GraduationReport'
import AccountingReportingFunctionality from '../pages/Accounting/ReportingFunctionality'
import AccountingSettings from '../pages/Accounting/Settings'


export default function AppRoutes() {
  const base = import.meta.env.PUBLIC_URL || '/';
  return (
    <AuthProvider>
      <Router>
        <Routes basename={base}>
          {/* Send users to the login page if not logged in */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public Route: Login Page */}
          <Route path="/login" element={<LogIn />} />

          {/* Protected Routes */}
          {/* Notifications Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reporting-functionality" element={<AdminEnrollmentReport />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/graduation-report" element={<AdminGraduationReport />} /> 
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* Advising Routes */}
          <Route element={<ProtectedRoute allowedRoles={['advisor']} />}>
            <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />
            <Route path="/advisor/advising" element={<Advising />} />
            <Route path="/advisor/reporting-functionality" element={<AdvisorReportingFunctionality />} />
            <Route path="/advisor/settings" element={<AdvisorSettings />} />
          </Route>

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/degree-tracking" element={<StudentDegreeTracking />} />
            <Route path="/student/settings" element={<StudentSettings />} />
          </Route>

          {/* Accounting Routes */}
          <Route element={<ProtectedRoute allowedRoles={['accounting']} />}>
            <Route path="/accounting/dashboard" element={<AccountingDashboard />} />
            <Route path="/accounting/graduation-report" element={<AccountingGraduationReport />} />
            <Route path="/accounting/settings" element={<AccountingSettings />} />
            <Route path="/accounting/reporting-functionality" element={<AccountingReportingFunctionality />} />
          </Route>

          {/* Fallback Route: Redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  )
}