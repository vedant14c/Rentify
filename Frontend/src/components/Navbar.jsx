import { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiCalendar,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import "../css/navbar.css";

function getLoggedInUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user")
    );
  } catch {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const user = getLoggedInUser();
  const token = localStorage.getItem("token");

  const role = String(
    user?.role ||
      localStorage.getItem("role") ||
      ""
  ).toUpperCase();

  const isUser = role === "USER";
  const isOwner = role === "OWNER";
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("officeSpacesUser");
    localStorage.removeItem("spacesHubUser");

    setMenuOpen(false);
    navigate("/login");
  };

  const getNavLinkClass = ({
    isActive,
  }) => {
    return isActive
      ? "nav-link active"
      : "nav-link";
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <NavLink
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
        >
          <span className="logo-icon">
            <FiMapPin />
          </span>

          <span>
            Spaces<span>Hub</span>
          </span>
        </NavLink>

        <button
          type="button"
          className="menu-button"
          onClick={() =>
            setMenuOpen(
              (previousValue) =>
                !previousValue
            )
          }
          aria-label="Open navigation menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <nav
          className={`navbar-menu ${
            menuOpen ? "menu-open" : ""
          }`}
        >
          <NavLink
            to="/"
            end
            className={getNavLinkClass}
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/offices"
            className={getNavLinkClass}
            onClick={closeMenu}
          >
            Properties
          </NavLink>

          {isUser && !isAdmin && (
            <NavLink
              to="/my-bookings"
              className={getNavLinkClass}
              onClick={closeMenu}
            >
              Bookings
            </NavLink>
          )}

          {isUser && !isAdmin && (
            <NavLink
              to="/favorites"
              className={getNavLinkClass}
              onClick={closeMenu}
            >
              Favorites
            </NavLink>
          )}

          {isOwner && !isAdmin && (
            <NavLink
              to="/owner-dashboard"
              className={getNavLinkClass}
              onClick={closeMenu}
            >
              My Properties
            </NavLink>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/admin-dashboard"
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                <FiShield />
                Dashboard
              </NavLink>

              <NavLink
                to="/admin-users"
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                <FiUsers />
                Users
              </NavLink>

              <NavLink
                to="/admin-bookings"
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                <FiCalendar />
                Requests
              </NavLink>
            </>
          )}

          {token && (
            <NavLink
              to="/profile"
              className={getNavLinkClass}
              onClick={closeMenu}
            >
              Profile
            </NavLink>
          )}

          {token && user ? (
            <div className="navbar-account">
              <NavLink
                to="/profile"
                className="navbar-user"
                onClick={closeMenu}
              >
                <span className="navbar-user-icon">
                  <FiUser />
                </span>

                <span className="navbar-user-details">
                  <small>Welcome</small>

                  <strong>
                    {user.name?.split(" ")[0] ||
                      "User"}
                  </strong>
                </span>
              </NavLink>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="login-button"
              onClick={closeMenu}
            >
              <FiLogIn />
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;