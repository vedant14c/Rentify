import { useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiLock,
  FiMail,
} from "react-icons/fi";
import { loginUser } from "../services/authService";
import "../css/auth.css";

function Login() {
  const location = useLocation();

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email:
      localStorage.getItem("rememberedEmail") || "",
    password: "",
    rememberMe: Boolean(
      localStorage.getItem("rememberedEmail")
    ),
  });

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]:
        type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = formData.email
      .trim()
      .toLowerCase();

    if (!email || !formData.password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await loginUser({
        email,
        password: formData.password,
      });

      if (!response?.token) {
        setError(
          response?.message ||
          "Invalid email or password."
        );
        return;
      }

      const role = String(
        response.role || "USER"
      ).toUpperCase();

      const user = {
        userId: response.userId,
        name: response.name,
        email: response.email,
        role,
      };

      localStorage.setItem(
        "token",
        response.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "userId",
        String(response.userId)
      );

      localStorage.setItem(
        "name",
        response.name || ""
      );

      localStorage.setItem("role", role);

      if (formData.rememberMe) {
        localStorage.setItem(
          "rememberedEmail",
          email
        );
      } else {
        localStorage.removeItem(
          "rememberedEmail"
        );
      }

      window.dispatchEvent(
        new Event("authChanged")
      );

      let defaultDestination = "/";

      if (role === "ADMIN") {
        defaultDestination =
          "/admin-dashboard";
      } else if (role === "OWNER") {
        defaultDestination =
          "/owner-dashboard";
      }

      const requestedPage =
        location.state?.from;

      const destination =
        requestedPage || defaultDestination;

      window.location.replace(destination);
    } catch (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      if (!loginError.response) {
        setError(
          "Cannot connect to the backend. Make sure Spring Boot is running."
        );
      } else if (
        typeof loginError.response.data ===
        "string"
      ) {
        setError(loginError.response.data);
      } else {
        setError(
          loginError.response.data?.message ||
          "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-information">
        <div className="auth-information-content">
          <Link to="/" className="auth-logo">
            <FiBriefcase />

            <span>
              Spaces<strong>Hub</strong>
            </span>
          </Link>

          <div className="auth-message">
            <p className="auth-label">
              WELCOME BACK
            </p>

            <h1>
              Your perfect rental property is only a few
              clicks away.
            </h1>

            <p>
              Sign in to manage your applications and
              discover verified properties for rent.
            </p>

            <div className="auth-benefits">
              <div>
                <FiCheckCircle />
                View and manage rental applications
              </div>

              <div>
                <FiCheckCircle />
                Save your favourite properties
              </div>

              <div>
                <FiCheckCircle />
                Track application status
              </div>
            </div>
          </div>

          <p className="auth-copyright">
            © 2026 SpacesHub. All rights
            reserved.
          </p>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-form-heading">
            <p>SIGN IN</p>

            <h2>Welcome back</h2>

            <span>
              Enter your database account details.
            </span>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
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
              Password

              <div className="auth-input">
                <FiLock />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  minLength="6"
                  required
                />

                <button
                  type="button"
                  className="show-password-button"
                  onClick={() =>
                    setShowPassword(
                      (previousValue) =>
                        !previousValue
                    )
                  }
                  aria-label="Show or hide password"
                >
                  {showPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
              </div>
            </label>

            <div className="auth-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />

                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="forgot-password"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiLoader className="loading-icon" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account?

            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;