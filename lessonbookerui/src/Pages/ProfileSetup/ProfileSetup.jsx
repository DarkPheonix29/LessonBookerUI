import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../Components/Header/Header';
import "./ProfileSetup.css";
import API_BASE_URL from "../../Components/API/API";

// Helper to get the Authorization header
const getAuthHeader = () => {
    const idToken = localStorage.getItem("idToken");
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
};

const ProfileSetup = ({ onProfileComplete }) => {
    const [profile, setProfile] = useState({
        displayName: '',
        phoneNumber: '',
        address: '',
        pickupAddress: '',
        dateOfBirth: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { email } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setProfile((prev) => ({ ...prev, email }));
    }, [email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "address") {
            setProfile((prev) => ({
                ...prev,
                address: value,
                pickupAddress: value, // keep pickupAddress in sync
            }));
        } else {
            setProfile((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const formattedProfile = {
                ...profile,
                dateOfBirth: profile.dateOfBirth
                    ? `${profile.dateOfBirth}T00:00:00`
                    : ''
            };

            const response = await axios.post(
                `${API_BASE_URL}/api/profile`,
                formattedProfile,
                { headers: getAuthHeader() }
            );
            if (response.status === 201) {
                if (onProfileComplete) onProfileComplete();
                navigate('/studentdashboard');
            } else {
                setError('Failed to create profile. Please try again.');
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Error while creating profile. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Header variant="login" />
            <div className="profileSetupContainer">
                <form onSubmit={handleSubmit} className="profileSetupBox">
                    <div className="inputGroup">
                        <label>Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            value={profile.displayName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="inputGroup">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={profile.phoneNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="inputGroup">
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={profile.address}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="inputGroup">
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={profile.dateOfBirth}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button
                        type="submit"
                        className="profileSetupButton"
                        disabled={submitting}
                    >
                        {submitting ? "Submitting..." : "Submit"}
                    </button>
                </form>
            </div>
        </>
    );
};

export default ProfileSetup;
