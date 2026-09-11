import { Navigate, useLocation } from "react-router-dom";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const userRole = String(
    user.role || localStorage.getItem("role") || ""
  ).toUpperCase();

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.toUpperCase()
  );

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(userRole)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;