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
import { getOwnerBookingRequests } from "../services/bookingService";
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
  const isGuest = !token;

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isOwner) return;
    const ownerId = user?.userId || user?.id || localStorage.getItem("userId");
    if (!ownerId) return;

    let active = true;
    getOwnerBookingRequests(ownerId)
      .then((requests) => {
        if (!active || !Array.isArray(requests)) return;
        const count = requests.filter(
          (r) => String(r.status || "").toUpperCase() === "PENDING"
        ).length;
        setPendingCount(count);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isOwner, location.pathname]);

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

  const getIntentNavClass = (targetIntent) => {
    const isPropsRoute = location.pathname === "/properties" || location.pathname === "/offices";
    const searchParams = new URLSearchParams(location.search);
    const currentIntent = searchParams.get("intent")?.toUpperCase();
    return isPropsRoute && currentIntent === targetIntent ? "nav-link active" : "nav-link";
  };

  const getAllPropertiesNavClass = () => {
    const isPropsRoute = location.pathname === "/properties" || location.pathname === "/offices";
    const searchParams = new URLSearchParams(location.search);
    const hasIntent = Boolean(searchParams.get("intent"));
    return isPropsRoute && !hasIntent ? "nav-link active" : "nav-link";
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
          {(isUser || isGuest) && (
            <>
              <NavLink
                to="/"
                end
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                Home
              </NavLink>

              <NavLink
                to="/properties?intent=RENT"
                className={() => getIntentNavClass("RENT")}
                onClick={closeMenu}
              >
                Rent
              </NavLink>

              <NavLink
                to="/properties?intent=BUY"
                className={() => getIntentNavClass("BUY")}
                onClick={closeMenu}
              >
                Buy
              </NavLink>

              <NavLink
                to="/properties"
                className={() => getAllPropertiesNavClass()}
                onClick={closeMenu}
              >
                Properties
              </NavLink>

              {isUser && (
                <>
                  <NavLink
                    to="/my-bookings"
                    className={getNavLinkClass}
                    onClick={closeMenu}
                  >
                    Bookings
                  </NavLink>

                  <NavLink
                    to="/favorites"
                    className={getNavLinkClass}
                    onClick={closeMenu}
                  >
                    Favorites
                  </NavLink>
                </>
              )}
            </>
          )}

          {isOwner && (
            <>
              <NavLink
                to="/owner-dashboard"
                end
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/owner-properties"
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                My Properties
              </NavLink>

              <NavLink
                to="/owner-bookings"
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                Bookings
                {pendingCount > 0 && (
                  <span className="navbar-badge-pill">{pendingCount}</span>
                )}
              </NavLink>
            </>
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
                to="/properties"
                className={getNavLinkClass}
                onClick={closeMenu}
              >
                Properties
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
                Bookings
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