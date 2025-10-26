import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { HeaderWithRouter } from './components/HeaderWithRouter';
import {
  AuthProvider,
  useAuth,
} from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AdminPage } from './pages/AdminPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { CartPage } from './pages/CartPage';
import { CategoryPage } from './pages/CategoryPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CreateStorePage } from './pages/CreateStorePage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePageWithRouter } from './pages/HomePageWithRouter';
import { ManageStorePage } from './pages/ManageStorePage';
import { ProductPage } from './pages/ProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { RetrievePasswordPage } from './pages/RetrievePasswordPage';
import { SearchPage } from './pages/SearchPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { StorePage } from './pages/StorePage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { VendorUpgradePage } from './pages/VendorUpgradePage';

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

  return profile?.role === "admin" ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" />
  );
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
        <Route path="/search" element={<SearchPage />} />
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
              <AdminPage
                onNavigate={(page: string) => {
                  /* handle navigation here */
                }}
              />
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
