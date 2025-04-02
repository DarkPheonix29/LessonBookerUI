import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../../Components/Header/Header';
import "./Signup.css";

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registrationKey, setRegistrationKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/account/signup', { email, password });
            if (response.status === 200) {
                navigate(`/profilesetup/${email}`);
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    return (
        <>
            <Header />
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