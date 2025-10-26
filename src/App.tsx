import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { HeaderWithRouter } from './components/HeaderWithRouter';
import { HomePageWithRouter } from './pages/HomePageWithRouter';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { RetrievePasswordPage } from './pages/RetrievePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateStorePage } from './pages/CreateStorePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { StorePage } from './pages/StorePage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductPage } from './pages/ProductPage';
import { ManageStorePage } from './pages/ManageStorePage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { VendorUpgradePage } from './pages/VendorUpgradePage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/signin" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return profile?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return user ? <Navigate to="/" /> : <>{children}</>;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWithRouter />
      <Routes>
        <Route path="/" element={<HomePageWithRouter />} />
        <Route
          path="/signin"
          element={
            <GuestRoute>
              <SignInPage />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignUpPage />
            </GuestRoute>
          }
        />
        <Route
          path="/retrieve"
          element={
            <GuestRoute>
              <RetrievePasswordPage />
            </GuestRoute>
          }
        />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/store/:storeSlug" element={<StorePage />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
        <Route path="/product/:productId" element={<ProductPage />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/store/create"
          element={
            <PrivateRoute>
              <CreateStorePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/store/manage/:storeId"
          element={
            <PrivateRoute>
              <ManageStorePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <CheckoutPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/upgrade-vendor"
          element={
            <PrivateRoute>
              <VendorUpgradePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/vendor-dashboard"
          element={
            <PrivateRoute>
              <VendorDashboardPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
