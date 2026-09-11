import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import OfficeList from "./pages/OfficeList";
import OfficeDetails from "./pages/OfficeDetails";
import BookOffice from "./pages/BookOffice";
import MyBookings from "./pages/MyBookings";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AddProperty from "./pages/AddProperty";
import OwnerDashboard from "./pages/OwnerDashboard";
import EditProperty from "./pages/EditProperty";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminBookings from "./pages/AdminBookings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import "./App.css";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public pages */}

        <Route path="/" element={<Home />} />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/offices"
          element={<OfficeList />}
        />

        <Route
          path="/office-details/:id"
          element={<OfficeDetails />}
        />

        <Route path="/login" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* User pages */}

        <Route
          path="/book-office/:id"
          element={
            <ProtectedRoute
              allowedRoles={["USER", "ADMIN", "OWNER"]}
            >
              <BookOffice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/book/:id"
          element={
            <ProtectedRoute
              allowedRoles={["USER", "ADMIN", "OWNER"]}
            >
              <BookOffice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute
              allowedRoles={["USER", "ADMIN", "OWNER"]}
            >
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <ProtectedRoute
              allowedRoles={["USER", "ADMIN", "OWNER"]}
            >
              <Favorites />
            </ProtectedRoute>
          }
        />

        {/* Shared page */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Owner pages */}

        <Route
          path="/list-property"
          element={
            <ProtectedRoute
              allowedRoles={["OWNER", "ADMIN"]}
            >
              <AddProperty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["OWNER", "ADMIN"]}
            >
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-property/:id"
          element={
            <ProtectedRoute
              allowedRoles={["OWNER", "ADMIN"]}
            >
              <EditProperty />
            </ProtectedRoute>
          }
        />

        {/* Admin pages */}

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-users"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-bookings"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <AdminBookings />
            </ProtectedRoute>
          }
        />

        {/* Wrong URL */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      <Footer />
    </>
  );
}

export default App;