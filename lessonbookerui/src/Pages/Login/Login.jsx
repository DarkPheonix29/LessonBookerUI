import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../firebase"; // Ensure Firebase is initialized

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

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            await axios.post("/api/account/login", { idToken });
            navigate("/dashboard");
        } catch (err) {
            setError("Failed to sign in with Google.");
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <button onClick={handleGoogleLogin}>Sign in with Google</button>
        </div>
    );
};

export default Login;
