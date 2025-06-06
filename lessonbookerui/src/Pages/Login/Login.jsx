import { useState } from "react";
import { signInWithEmailAndPassword, getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../firebase";
import Header from "../../Components/Header/Header";
import "./Login.css";
import API_BASE_URL from "../../Components/API/API";
import { isProfileComplete } from "../../Components/ProfileCheck";

const Login = ({ fetchAndSetRole }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    // Forgot password state
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetMessage, setResetMessage] = useState("");

    const navigate = useNavigate();
    const auth = getAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            localStorage.setItem("idToken", idToken);
            const response = await axios.post(`${API_BASE_URL}/api/account/login`, { idToken });
            if (fetchAndSetRole) {
                await fetchAndSetRole();
            }
            const hasProfile = await isProfileComplete(email);
            if (response.data.role === "student") {
                if (hasProfile) {
                    navigate("/studentdashboard");
                } else {
                    navigate(`/profilesetup/${email}`);
                }
            } else if (response.data.role === "instructor") {
                navigate("/instructordashboard");
            } else if (response.data.role === "admin") {
                navigate("/adminpanel");
            } else {
                navigate("/");
            }
        } catch (err) {
            setError("Failed to log in. Please check your credentials.");
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setResetMessage("");
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetMessage("Password reset email sent. Please check your inbox.");
            setTimeout(() => {
                setShowReset(false);
                setResetEmail("");
                setResetMessage("");
            }, 2500);
        } catch (err) {
            setResetMessage("Failed to send reset email. Please check the address.");
        }
    };

    const handleShowReset = () => {
        setShowReset(true);
        setResetEmail("");
        setResetMessage("");
    };

    const handleBackToLogin = () => {
        setShowReset(false);
        setResetEmail("");
        setResetMessage("");
    };

    return (
        <>
            <Header variant="login" />
            <div className="loginContainer">
                <div className="loginBox">
                    {!showReset ? (
                        <form onSubmit={handleLogin}>
                            <div className="inputGroup">
                                <label htmlFor="email">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="inputGroup">
                                <label htmlFor="password">Password:</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="error">{error}</p>}
                            <button type="submit" className="loginButton">Login</button>
                            <p className="forgotLink">
                                <button
                                    type="button"
                                    className="linkButton"
                                    onClick={handleShowReset}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#0077a6",
                                        cursor: "pointer",
                                        padding: 0,
                                        textDecoration: "underline"
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </p>
                            <p className="registerLink">
                                Don't have an account? <a href="/signup">Sign up</a>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordReset}>
                            <div className="inputGroup">
                                <label htmlFor="resetEmail">Enter your email:</label>
                                <input
                                    type="email"
                                    id="resetEmail"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="loginButton">Send Reset Email</button>
                            <button
                                type="button"
                                className="loginButton"
                                style={{
                                    marginTop: 10,
                                    background: "#fff",
                                    color: "#0077a6",
                                    border: "1px solid #00cfff"
                                }}
                                onClick={handleBackToLogin}
                            >
                                Back to login
                            </button>
                            {resetMessage && <p className="info">{resetMessage}</p>}
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default Login;
