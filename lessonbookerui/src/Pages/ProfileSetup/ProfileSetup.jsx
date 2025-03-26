import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';

const ProfileSetup = () => {
    const [profile, setProfile] = useState({
        displayName: '',
        phoneNumber: '',
        address: '',
        pickupAddress: '',
        dateOfBirth: '',
    });
    const { email } = useParams();
    const history = useHistory();

    useEffect(() => {
        // Fetch the email to pre-fill any necessary fields if required
        setProfile((prev) => ({ ...prev, email }));
    }, [email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Send profile data to backend for storage
            const response = await axios.post('/api/profile', profile);

            if (response.status === 201) {
                // If profile is created successfully, redirect to a confirmation or dashboard page
                history.push('/dashboard');
            }
        } catch (error) {
            console.error('Error while creating profile:', error);
        }
    };

    return (
        <div>
            <h2>Set Up Your Profile</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Display Name</label>
                    <input
                        type="text"
                        name="displayName"
                        value={profile.displayName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Phone Number</label>
                    <input
                        type="text"
                        name="phoneNumber"
                        value={profile.phoneNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Address</label>
                    <input
                        type="text"
                        name="address"
                        value={profile.address}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Pickup Address</label>
                    <input
                        type="text"
                        name="pickupAddress"
                        value={profile.pickupAddress}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Date of Birth</label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        value={profile.dateOfBirth}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default ProfileSetup;
