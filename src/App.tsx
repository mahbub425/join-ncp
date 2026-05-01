import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MembershipForm from './pages/MembershipForm';
import AdminDashboard from './pages/admin/Dashboard';
import Login from './pages/admin/Login';
import SubmissionsList from './pages/admin/SubmissionsList';
import SubmissionDetail from './pages/admin/SubmissionDetail';
import CMSEditor from './pages/admin/CMSEditor';
import FormBuilder from './pages/admin/FormBuilder';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<MembershipForm />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/submissions" 
            element={
              <ProtectedRoute>
                <SubmissionsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/submissions/details" 
            element={
              <ProtectedRoute>
                <SubmissionDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/submissions/:id" 
            element={
              <ProtectedRoute>
                <SubmissionDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cms" 
            element={
              <ProtectedRoute>
                <CMSEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/form-builder" 
            element={
              <ProtectedRoute>
                <FormBuilder />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
