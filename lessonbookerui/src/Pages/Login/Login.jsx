import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, getAuth, signInWithEmailAndPassword } from "firebase/auth";
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            await axios.post("/api/account/login", { idToken });
            navigate("/dashboard"); // Adjust based on role
        } catch (err) {
            setError("Failed to log in. Please check your credentials.");
        }
    };

    return (
        <>
            <Header />
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
