import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registrationKey, setRegistrationKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Call your backend to sign up the user using Firebase credentials
            const response = await axios.post('/api/account/signup', { email, password });

            // If signup is successful, redirect to profile setup page
            if (response.status === 200) {
                history.push(`/profile-setup/${email}`);
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    return (
        <div>
            <h2>Signup</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Registration Key</label>
                    <input
                        type="text"
                        value={registrationKey}
                        onChange={(e) => setRegistrationKey(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Sign Up</button>
            </form>
            {errorMessage && <p>{errorMessage}</p>}
        </div>
    );
};

export default Signup;
