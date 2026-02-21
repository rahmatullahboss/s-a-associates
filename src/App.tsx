import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RootLayout from './pages/layout';
import HomePage from './pages/page';

// Public Pages
import AboutPage from './pages/about/page';
import ContactPage from './pages/contact/page';
import ServicesPage from './pages/services/page';

// Auth Pages
import StudentLoginPage from './pages/student/login/page';
import StudentSignupPage from './pages/student/signup/page';
import AdminLoginPage from './pages/admin/login/page';

// Dashboard
import DashboardLayout from './pages/dashboard/layout';
import DashboardHomePage from './pages/dashboard/page';
import ProfilePage from './pages/dashboard/profile/page';
import ApplicationsPage from './pages/dashboard/applications/page';
import NewApplicationPage from './pages/dashboard/applications/new/page';
import DocumentsPage from './pages/dashboard/documents/page';
import SettingsPage from './pages/dashboard/settings/page';
import MessagesPage from './pages/dashboard/messages/page';
import QueuePage from './pages/dashboard/queue/page';
import LeadsPage from './pages/dashboard/leads/page';
import BookingsPage from './pages/dashboard/bookings/page';
import BookingDetailsPage from './pages/dashboard/bookings/[id]/page';
import StudentsPage from './pages/dashboard/students/page';
import StudentDetailsPage from './pages/dashboard/students/[id]/page';

import GlobalErrorPage from './pages/global-error';

function App() {
  return (
    <Router>
      <RootLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/services" element={<ServicesPage />} />

          {/* Auth Routes */}
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/student/signup" element={<StudentSignupPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Dashboard Routes (Protected) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHomePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/new" element={<NewApplicationPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="queue" element={<QueuePage />} />
            
            {/* Admin/Agent Specific Dashboard Routes */}
            <Route path="leads" element={<LeadsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:id" element={<BookingDetailsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentDetailsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<GlobalErrorPage error={new Error('Page Not Found')} reset={() => window.location.href = '/'} />} />
        </Routes>
      </RootLayout>
    </Router>
  );
}

export default App;
