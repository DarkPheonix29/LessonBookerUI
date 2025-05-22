import { useState } from "react";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../firebase"; // Ensure Firebase is initialized
import Header from "../../Components/Header/Header";
import "./Login.css";
import API_BASE_URL from "../../Components/API/API";

const Login = ({ fetchAndSetRole }) => {
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
            const idToken = await userCredential.user.getIdToken();

            // Step 2: Send ID token to backend for verification
            await axios.post(`${API_BASE_URL}/api/account/login`, { idToken });

            // Step 3: Fetch and set role in App state
            if (fetchAndSetRole) {
                await fetchAndSetRole();
            }

            // Step 4: Let AppRoutes handle the redirect based on role
            navigate("/");

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
