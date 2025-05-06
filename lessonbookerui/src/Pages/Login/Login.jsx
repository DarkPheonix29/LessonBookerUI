import { useState } from "react";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../firebase"; // Ensure Firebase is initialized
import Header from "../../Components/Header/Header";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const auth = getAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Step 1: Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken(); // Get ID token

            // Step 2: Send ID token to backend for verification and role retrieval
            const response = await axios.post("/api/account/login", { idToken });

            // Step 3: Handle the backend response and navigate
            if (response.data && response.data.role) {
                const role = response.data.role;
                switch (role) {
                    case "admin":
                        navigate("/adminpanel");
                        break;
                    case "student":
                        navigate("/studentdashboard");
                        break;
                    case "instructor":
                        navigate("/instructordashboard");
                        break;
                    default:
                        setError("Role not assigned. Please contact support.");
                        break;
                }
            } else {
                setError("Failed to log in. Please check your credentials.");
            }
        } catch (err) {
            setError("Failed to log in. Please check your credentials.");
        }
    };

    return (
        <>
            <Header variant="login" />
            <div className="loginContainer">
                <form onSubmit={handleLogin} className="loginBox">
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
                    <p className="registerLink">
                        Don't have an account? <a href="/signup">Sign up</a>
                    </p>
                </form>
            </div>
        </>
    );
};

export default Login;
