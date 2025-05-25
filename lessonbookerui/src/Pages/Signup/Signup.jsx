import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Header from '../../Components/Header/Header';
import "./Signup.css";
import API_BASE_URL from "../../Components/API/API";
import { isProfileComplete } from "../../Components/ProfileCheck";

function getPasswordStrength(password) {
    if (!password) return '';
    if (password.length < 6) return 'Weak';
    if (
        password.length >= 10 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    ) return 'Strong';
    if (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password)
    ) return 'Medium';
    return 'Weak';
}

const Signup = ({ fetchAndSetRole }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registrationKey, setRegistrationKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const navigate = useNavigate();

    const handlePasswordChange = (e) => {
        const pw = e.target.value;
        setPassword(pw);
        setPasswordStrength(getPasswordStrength(pw));
        // Re-validate confirm password
        if (confirmPassword && pw !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match");
        } else {
            setConfirmPasswordError("");
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const cpw = e.target.value;
        setConfirmPassword(cpw);
        if (password !== cpw) {
            setConfirmPasswordError("Passwords do not match");
        } else {
            setConfirmPasswordError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (password !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match");
            return;
        }
        if (passwordStrength === 'Weak') {
            setErrorMessage("Password is too weak.");
            return;
        }
        try {
            // 1. Signup (create user in backend and Firebase Auth)
            const signupResponse = await axios.post(`${API_BASE_URL}/api/Account/signup`, {
                email,
                password,
                registrationKey
            });

            if (signupResponse.status === 200) {
                // 2. Sign in with Firebase Auth to get the ID token
                const auth = getAuth();
                await signInWithEmailAndPassword(auth, email, password);
                const idToken = await auth.currentUser.getIdToken();

                // 3. Send ID token to backend to get JWT/session
                const loginResponse = await axios.post(`${API_BASE_URL}/api/account/login`, {
                    idToken
                });

                // 4. Store JWT (or use idToken if backend doesn't return a new one)
                if (loginResponse.data && loginResponse.data.token) {
                    localStorage.setItem("idToken", loginResponse.data.token);
                } else {
                    localStorage.setItem("idToken", idToken);
                }

                // 5. Fetch and set role
                if (fetchAndSetRole) {
                    await fetchAndSetRole();
                }

                // 6. Check for profile and redirect accordingly
                const hasProfile = await isProfileComplete(email);
                if (loginResponse.data.role === "student") {
                    if (hasProfile) {
                        navigate("/studentdashboard");
                    } else {
                        navigate(`/profilesetup/${email}`);
                    }
                } else if (loginResponse.data.role === "instructor") {
                    navigate("/instructordashboard");
                } else if (loginResponse.data.role === "admin") {
                    navigate("/adminpanel");
                } else {
                    navigate("/");
                }
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    return (
        <>
            <Header variant="login" />
            <div className="signupContainer">
                <form onSubmit={handleSubmit} className="signupBox">
                    <div className="inputGroup">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="inputGroup">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            autoComplete="new-password"
                        />
                        {password && (
                            <div className={`password-strength ${passwordStrength.toLowerCase()}`}>
                                Password strength: {passwordStrength}
                            </div>
                        )}
                    </div>
                    <div className="inputGroup">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            required
                            autoComplete="new-password"
                        />
                        {confirmPasswordError && (
                            <div className="error">{confirmPasswordError}</div>
                        )}
                    </div>
                    <div className="inputGroup">
                        <label>Registration Key</label>
                        <input
                            type="text"
                            value={registrationKey}
                            onChange={e => setRegistrationKey(e.target.value)}
                            required
                        />
                    </div>
                    {errorMessage && <p className="error">{errorMessage}</p>}
                    <button
                        type="submit"
                        className="signupButton"
                        disabled={
                            !email ||
                            !password ||
                            !confirmPassword ||
                            password !== confirmPassword ||
                            passwordStrength === 'Weak'
                        }
                    >
                        Sign Up
                    </button>
                    <p className="registerLink">
                        Already have an account? <a href="/login">Log in</a>
                    </p>
                </form>
            </div>
        </>
    );
};

export default Signup;
