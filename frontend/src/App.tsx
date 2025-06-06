import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { ReservationProvider } from "./context/ReservationContext";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Menu from "./pages/Menu";
import MenuItemDetail from "./pages/MenuItemDetail";
import Reservations from "./pages/Reservations";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import DeliveryTracking from "./pages/DeliveryTracking";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import Register from "./pages/Register";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children, adminOnly = false, deliveryOnly = false, userOnly = false }) => {
  const { isAuthenticated, isAdmin, isDeliveryBoy } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  if (deliveryOnly && !isDeliveryBoy) {
    return <Navigate to="/" />;
  }
  
  if (userOnly && (isAdmin || isDeliveryBoy)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, isDeliveryBoy, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Return different routes based on user type
  return (
    <Routes>
      {/* Public Routes - accessible by anyone */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

      {/* Protected Routes - need authentication */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      {/* Routes for Regular Users */}
      {!isAuthenticated || (!isAdmin && !isDeliveryBoy) ? (
        <>
          <Route path="/about" element={
            isAuthenticated ? (
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          <Route path="/contact" element={
            isAuthenticated ? (
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          <Route path="/menu" element={
            <ProtectedRoute userOnly={true}>
              <Menu />
            </ProtectedRoute>
          } />
          
          <Route path="/menu/:id" element={
            <ProtectedRoute userOnly={true}>
              <MenuItemDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/reservations" element={
            <ProtectedRoute userOnly={true}>
              <Reservations />
            </ProtectedRoute>
          } />
          
          <Route path="/cart" element={
            <ProtectedRoute userOnly={true}>
              <Cart />
            </ProtectedRoute>
          } />
          
          <Route path="/checkout" element={
            <ProtectedRoute userOnly={true}>
              <Checkout />
            </ProtectedRoute>
          } />
          
          <Route path="/delivery-tracking" element={
            <ProtectedRoute userOnly={true}>
              <DeliveryTracking />
            </ProtectedRoute>
          } />
        </>
      ) : null}
      
      {/* Admin Routes */}
      {isAuthenticated && isAdmin && (
        <>
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          } />
          
          <Route path="/about" element={
            <ProtectedRoute adminOnly={true}>
              <About />
            </ProtectedRoute>
          } />
          
          <Route path="/contact" element={
            <ProtectedRoute adminOnly={true}>
              <Contact />
            </ProtectedRoute>
          } />
        </>
      )}
      
      {/* Delivery Boy Routes */}
      {isAuthenticated && isDeliveryBoy && (
        <Route path="/delivery-dashboard" element={
          <ProtectedRoute deliveryOnly={true}>
            <DeliveryDashboard />
          </ProtectedRoute>
        } />
      )}
      
      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <ReservationProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <Toaster />
                  <Sonner />
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </ReservationProvider>
          </CartProvider>
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
