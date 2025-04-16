import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../Components/Header/Header';
import "./ProfileSetup.css";

const ProfileSetup = () => {
    const [profile, setProfile] = useState({
        displayName: '',
        phoneNumber: '',
        address: '',
        pickupAddress: '',
        dateOfBirth: '',
    });
    const { email } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setProfile((prev) => ({ ...prev, email }));
    }, [email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/profile', profile);
            if (response.status === 201) {
                navigate('/studentdashboard');
            }
        } catch (error) {
            console.error('Error while creating profile:', error);
        }
    };

    return (
        <>
            <Header variant="login" />
            <div className="profileSetupContainer">
                <form onSubmit={handleSubmit} className="profileSetupBox">
                    <div className="inputGroup">
                        <label>Display Name</label>
                        <input type="text" name="displayName" value={profile.displayName} onChange={handleChange} required />
                    </div>
                    <div className="inputGroup">
                        <label>Phone Number</label>
                        <input type="text" name="phoneNumber" value={profile.phoneNumber} onChange={handleChange} required />
                    </div>
                    <div className="inputGroup">
                        <label>Address</label>
                        <input type="text" name="address" value={profile.address} onChange={handleChange} required />
                    </div>
                    <div className="inputGroup">
                        <label>Pickup Address</label>
                        <input type="text" name="pickupAddress" value={profile.pickupAddress} onChange={handleChange} required />
                    </div>
                    <div className="inputGroup">
                        <label>Date of Birth</label>
                        <input type="date" name="dateOfBirth" value={profile.dateOfBirth} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="profileSetupButton">Submit</button>
                </form>
            </div>
        </>
    );
};

export default ProfileSetup;
