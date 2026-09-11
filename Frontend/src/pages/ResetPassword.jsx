import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import "../css/auth.css";

function ResetPassword() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {

            setLoading(true);
            setMessage("");

            const response = await resetPassword(
                token,
                password
            );

            setMessage(response);

            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (error) {

            console.error(error);

            setMessage(
                error.response?.data ||
                "Unable to reset password."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="forgot-password-page">

            <div className="forgot-password-card">

                <h2>Reset Password</h2>

                <p>
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="auth-form-group">

                        <label>New Password</label>

                        <div className="auth-input">

                            <input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                        </div>

                    </div>

                    <div className="auth-form-group">

                        <label>Confirm Password</label>

                        <div className="auth-input">

                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />

                        </div>

                    </div>

                    <button
                        type="submit"
                        className="auth-submit-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Updating..."
                            : "Reset Password"}

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

                    Back to Login

                </Link>

            </div>

        </div>

    );

}

export default ResetPassword;