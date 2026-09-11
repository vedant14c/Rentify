import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import "../css/auth.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const response = await forgotPassword(email);

            setMessage(response);
        } catch (error) {
            console.error(error);
            setMessage("Unable to send reset link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-card">

                <h2>Forgot Password</h2>

                <p>
                    Enter your registered email address and we'll send you
                    a password reset link.
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="auth-form-group">

                        <label>Email Address</label>

                        <div className="auth-input">

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                        </div>

                    </div>

                    <button
                        type="submit"
                        className="auth-submit-button"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                </form>

                {message && (
                    <div className="forgot-success">
                        {message}
                    </div>
                )}

                <Link
                    to="/login"
                    className="back-login"
                >
                    ← Back to Login
                </Link>

            </div>
        </div>
    );
}

export default ForgotPassword;