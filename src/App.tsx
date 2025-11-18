import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AgentDashboard from './pages/agent/Dashboard';
import CaptureLead from './pages/agent/CaptureLead';
import MyLeads from './pages/agent/MyLeads';
import ManagerDashboard from './pages/manager/Dashboard';
import AllLeads from './pages/manager/AllLeads';
import Agents from './pages/manager/Agents';
import Reports from './pages/manager/Reports';
import Services from './pages/Services';

function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-text-secondary">Loading application…</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to={user?.role === 'manager' ? '/manager/dashboard' : '/agent/dashboard'} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to={user?.role === 'manager' ? '/manager/dashboard' : '/agent/dashboard'} replace /> : <Register />}
      />
      <Route
        path="/agent/dashboard"
        element={
          <ProtectedRoute requiredRole="agent">
            <Layout>
              <AgentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/capture-lead"
        element={
          <ProtectedRoute requiredRole="agent">
            <Layout>
              <CaptureLead />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/leads"
        element={
          <ProtectedRoute requiredRole="agent">
            <Layout>
              <MyLeads />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute requiredRole="manager">
            <Layout>
              <ManagerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/leads"
        element={
          <ProtectedRoute requiredRole="manager">
            <Layout>
              <AllLeads />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/agents"
        element={
          <ProtectedRoute requiredRole="manager">
            <Layout>
              <Agents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute requiredRole="manager">
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Layout>
              <Services />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

