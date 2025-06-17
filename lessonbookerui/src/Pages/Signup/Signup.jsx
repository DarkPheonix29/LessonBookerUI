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

    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (password.length >= 10 && hasUpper && hasNumber && hasSpecial) return 'Strong';
    if (password.length >= 8 && hasUpper && hasNumber) return 'Medium';
    return 'Weak';
}

function validateSignup(password, confirmPassword, passwordStrength, setConfirmPasswordError, setPasswordError) {
    if (password.localeCompare(confirmPassword) !== 0) {
        setConfirmPasswordError("Passwords do not match");
        return false;
    }
    if (passwordStrength === 'Weak') {
        setPasswordError("Password is too weak.");
        return false;
    }
    return true;
}

const Signup = ({ fetchAndSetRole }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registrationKey, setRegistrationKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();

    const handlePasswordChange = (e) => {
        const pw = e.target.value;
        setPassword(pw);
        const strength = getPasswordStrength(pw);
        setPasswordStrength(strength);

        // Show error immediately if password is weak
        if (pw && strength === 'Weak') {
            setPasswordError("Password is too weak.");
        } else {
            setPasswordError("");
        }

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
        if (password.localeCompare(cpw) !== 0) {
            setConfirmPasswordError("Passwords do not match");
        } else {
            setConfirmPasswordError("");
        }
    };

    function storeToken(token, idToken) {
        localStorage.setItem("idToken", token || idToken);
    }

    function navigateByRole(role, hasProfile, email, navigate) {
        if (role === "student") {
            navigate(hasProfile ? "/studentdashboard" : `/profilesetup/${email}`);
        } else if (role === "instructor") {
            navigate("/instructordashboard");
        } else if (role === "admin") {
            navigate("/adminpanel");
        } else {
            navigate("/");
        }
    }

    async function signupAndLogin({ email, password, registrationKey }) {
        // 1. Signup (create user in backend and Firebase Auth)
        const signupResponse = await axios.post(`${API_BASE_URL}/api/Account/signup`, {
            email,
            password,
            registrationKey
        });

        if (signupResponse.status !== 200) {
            throw new Error('Signup failed');
        }

        // 2. Sign in with Firebase Auth to get the ID token
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);
        const idToken = await auth.currentUser.getIdToken();

        // 3. Send ID token to backend to get JWT/session
        const loginResponse = await axios.post(`${API_BASE_URL}/api/account/login`, {
            idToken
        });

        return { loginData: loginResponse.data, idToken };
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!validateSignup(password, confirmPassword, passwordStrength, setConfirmPasswordError, setPasswordError)) {
            return;
        }
        try {
            const { loginData, idToken } = await signupAndLogin({ email, password, registrationKey });
            storeToken(loginData?.token, idToken);

            if (fetchAndSetRole) {
                await fetchAndSetRole();
            }

            const hasProfile = await isProfileComplete(email);
            navigateByRole(loginData.role, hasProfile, email, navigate);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || 'Signup failed. Please try again.');
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
                        {passwordError && (
                            <div className="error">{passwordError}</div>
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
