import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import WorkerLayout from './components/WorkerLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Prescriptions from './pages/Prescriptions';
import ExpiryAlerts from './pages/ExpiryAlerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import POS from './pages/POS';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

// Conditional Layout Component based on user role
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Workers get minimal layout; owners get full layout
  if (user?.role === 'worker') {
    return <WorkerLayout>{children}</WorkerLayout>;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Owner Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <Medicines />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <Suppliers />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <PurchaseOrders />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <Prescriptions />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expiry-alerts"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <ExpiryAlerts />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRole="owner">
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Worker Route (POS) — placeholder for now */}
      <Route
        path="/pos"
        element={
          <ProtectedRoute requiredRole="worker">
            <AppLayout>
              <POS />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback — not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
