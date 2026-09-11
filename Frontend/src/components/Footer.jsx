import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import "../css/footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-glow footer-glow-one"></div>
      <div className="footer-glow footer-glow-two"></div>

      <div className="container footer-container">
        <div className="footer-main">
          <div className="footer-about">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-icon">
                <FiMapPin />
              </span>

              <span>
                Spaces<strong>Hub</strong>
              </span>
            </Link>

            <p>
              Discover verified rental properties including offices, houses, apartments, and villas.
            </p>

            <Link to="/offices" className="footer-explore">
              Explore Rentals
              <FiArrowUpRight />
            </Link>
          </div>

          <div className="footer-links">
            <h3>Explore</h3>

            <Link to="/">Home</Link>
            <Link to="/offices">Browse Rentals</Link>
            <Link to="/my-bookings">My Applications</Link>
            <Link to="/profile">Profile</Link>
          </div>

          <div className="footer-links">
            <h3>Account</h3>

            <Link to="/login">Login</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/profile">Manage Profile</Link>
          </div>

          <div className="footer-contact">
            <h3>Contact Us</h3>

            <p>
              <FiMapPin />
              <span>
                Pune, Maharashtra
                <small>India</small>
              </span>
            </p>

            <p>
              <FiPhone />
              <span>+91 98765 43210</span>
            </p>

            <p>
              <FiMail />
              <span>support@spaceshub.in</span>
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {currentYear} SpacesHub. All rights reserved.
          </p>

          <div>
            <button type="button">Privacy Policy</button>
            <button type="button">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;