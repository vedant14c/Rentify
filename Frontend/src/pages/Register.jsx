import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { registerUser } from "../services/authService";
import "../css/auth.css";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "USER",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        password: formData.password,
      });

      if (
        typeof response === "string" &&
        response.toLowerCase().includes("successful")
      ) {
        navigate("/login");
        return;
      }

      if (
        response?.message
          ?.toLowerCase()
          .includes("successful")
      ) {
        navigate("/login");
        return;
      }

      setError(
        typeof response === "string"
          ? response
          : response?.message || "Registration failed."
      );
    } catch (requestError) {
      console.error("Registration error:", requestError);

      if (!requestError.response) {
        setError(
          "Cannot connect to the backend. Make sure the server is running."
        );
      } else {
        const responseData = requestError.response.data;

        setError(
          typeof responseData === "string"
            ? responseData
            : responseData?.message ||
                "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <section className="auth-information">
        <div className="auth-information-content">
          <Link to="/" className="auth-logo">
            <FiBriefcase />

            <span>
              Spaces<strong>Hub</strong>
            </span>
          </Link>

          <div className="auth-message">
            <p className="auth-label">JOIN SPACES HUB</p>

            <h1>Find your perfect rental property.</h1>

            <p>
              Create your account and start discovering offices, houses,
              apartments and villas in top locations.
            </p>

            <div className="auth-benefits">
              <div>
                <FiCheckCircle />
                Access verified rental properties
              </div>

              <div>
                <FiCheckCircle />
                Send and manage rental applications
              </div>

              <div>
                <FiCheckCircle />
                List properties as a property owner
              </div>
            </div>
          </div>

          <p className="auth-copyright">
            © 2026 SpacesHub. All rights reserved.
          </p>
        </div>
      </section>

      <section className="auth-form-section register-form-section">
        <div className="auth-form-container">
          <div className="auth-form-heading">
            <p>CREATE ACCOUNT</p>
            <h2>Get started</h2>
            <span>Enter your details to create your account.</span>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-form-group">
              Full name

              <div className="auth-input">
                <FiUser />

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </label>

            <label className="auth-form-group">
              Email address

              <div className="auth-input">
                <FiMail />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="auth-form-group">
              Phone number

              <div className="auth-input">
                <FiPhone />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
              </div>
            </label>

            <label className="auth-form-group">
              Account type

              <select
                className="auth-select"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="USER">
                  User (Tenant) – Browse & rent properties
                </option>

                <option value="OWNER">
                  Owner – List rental properties
                </option>
              </select>
            </label>

            <label className="auth-form-group">
              Password

              <div className="auth-input">
                <FiLock />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  minLength="6"
                  required
                />

                <button
                  type="button"
                  className="show-password-button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label="Show or hide password"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <label className="auth-form-group">
              Confirm password

              <div className="auth-input">
                <FiLock />

                <input
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  minLength="6"
                  required
                />

                <button
                  type="button"
                  className="show-password-button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label="Show or hide confirm password"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
              </div>
            </label>

            <label className="terms-option">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
              />

              <span>
                I agree to the terms and privacy policy.
              </span>
            </label>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;