import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../../Components/Header/Header';
import "./Signup.css";
import API_BASE_URL from "../../Components/API/API";

const Signup = ({ fetchAndSetRole }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registrationKey, setRegistrationKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Signup
            const signupResponse = await axios.post(`${API_BASE_URL}/api/Account/signup`, {
                email,
                password,
                registrationKey
            });

            if (signupResponse.status === 200) {
                // 2. Login (get JWT)
                const loginResponse = await axios.post(`${API_BASE_URL}/api/account/login`, {
                    idToken: signupResponse.data.token || signupResponse.data.idToken // or whatever your backend returns
                });

                // If your backend returns a token directly on signup, you can skip this login step and use that token.

                // 3. Store JWT
                if (loginResponse.data && loginResponse.data.token) {
                    localStorage.setItem("idToken", loginResponse.data.token);
                } else if (signupResponse.data && signupResponse.data.token) {
                    // fallback if signup already returns a token
                    localStorage.setItem("idToken", signupResponse.data.token);
                } else {
                    setErrorMessage("Signup succeeded but login failed.");
                    return;
                }

                // 4. Fetch and set role
                if (fetchAndSetRole) {
                    await fetchAndSetRole();
                }

                // 5. Navigate to profile setup
                navigate(`/profilesetup/${email}`);
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
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="inputGroup">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="inputGroup">
                        <label>Registration Key</label>
                        <input type="text" value={registrationKey} onChange={(e) => setRegistrationKey(e.target.value)} required />
                    </div>
                    {errorMessage && <p className="error">{errorMessage}</p>}
                    <button type="submit" className="signupButton">Sign Up</button>
                    <p className="registerLink">
                        Already have an account? <a href="/login">Log in</a>
                    </p>
                </form>
            </div>
        </>
    );
};

export default Signup;
