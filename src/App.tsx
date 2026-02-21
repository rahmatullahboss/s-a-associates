import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RootLayout from './pages/layout';
import { Loader2 } from 'lucide-react';

// Public Pages
const HomePage = lazy(() => import('./pages/page'));
const AboutPage = lazy(() => import('./pages/about/page'));
const ContactPage = lazy(() => import('./pages/contact/page'));
const ServicesPage = lazy(() => import('./pages/services/page'));

// Auth Pages
const StudentLoginPage = lazy(() => import('./pages/student/login/page'));
const StudentSignupPage = lazy(() => import('./pages/student/signup/page'));
const AdminLoginPage = lazy(() => import('./pages/admin/login/page'));

// Dashboard
const DashboardLayout = lazy(() => import('./pages/dashboard/layout'));
const DashboardHomePage = lazy(() => import('./pages/dashboard/page'));
const ProfilePage = lazy(() => import('./pages/dashboard/profile/page'));
const ApplicationsPage = lazy(() => import('./pages/dashboard/applications/page'));
const NewApplicationPage = lazy(() => import('./pages/dashboard/applications/new/page'));
const DocumentsPage = lazy(() => import('./pages/dashboard/documents/page'));
const SettingsPage = lazy(() => import('./pages/dashboard/settings/page'));
const MessagesPage = lazy(() => import('./pages/dashboard/messages/page'));
const QueuePage = lazy(() => import('./pages/dashboard/queue/page'));
const LeadsPage = lazy(() => import('./pages/dashboard/leads/page'));
const BookingsPage = lazy(() => import('./pages/dashboard/bookings/page'));
const BookingDetailsPage = lazy(() => import('./pages/dashboard/bookings/[id]/page'));
const StudentsPage = lazy(() => import('./pages/dashboard/students/page'));
const StudentDetailsPage = lazy(() => import('./pages/dashboard/students/[id]/page'));
const GlobalErrorPage = lazy(() => import('./pages/global-error'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <RootLayout>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </RootLayout>
    </Router>
  );
}

export default App;
