import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminPanel = () => {
    const [students, setStudents] = useState([]);
    const [newKey, setNewKey] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [profileData, setProfileData] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Fetch all students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get("/api/admin/students");
                setStudents(response.data);
            } catch (error) {
                setMessage("Failed to fetch students");
            }
        };

        fetchStudents();
    }, []);

    // Handle key generation
    const generateKey = async () => {
        try {
            const response = await axios.post("/api/admin/generate-key");
            setNewKey(response.data.Key);
            setMessage("New registration key generated successfully.");
        } catch (error) {
            setMessage("Failed to generate key.");
        }
    };

    // Handle revoking student access
    const revokeAccess = async (uid) => {
        try {
            await axios.post(`/api/admin/revoke-access/${uid}`);
            setMessage("Access revoked successfully.");
            // Refresh student list after revocation
            const updatedStudents = students.filter(student => student.uid !== uid);
            setStudents(updatedStudents);
        } catch (error) {
            setMessage("Failed to revoke access.");
        }
    };

    // Handle profile update
    const updateProfile = async () => {
        try {
            await axios.put("/api/admin/update-profile", profileData);
            setMessage("Profile updated successfully.");
            setProfileData({});
            setSelectedStudent(null); // Clear selected student after update
        } catch (error) {
            setMessage("Failed to update profile.");
        }
    };

    return (
        <div className="admin-panel">
            <h1>Admin Panel</h1>

            <section>
                <h2>Generate Registration Key</h2>
                <button onClick={generateKey}>Generate Key</button>
                {newKey && <p>Generated Key: {newKey}</p>}
            </section>

            <section>
                <h2>Current Students</h2>
                <ul>
                    {students.map((student) => (
                        <li key={student.uid}>
                            <div>
                                <strong>{student.name}</strong> - {student.email}
                                <button onClick={() => setSelectedStudent(student)}>Update Profile</button>
                                <button onClick={() => revokeAccess(student.uid)}>Revoke Access</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {selectedStudent && (
                <section>
                    <h2>Update Profile for {selectedStudent.name}</h2>
                    <input
                        type="text"
                        placeholder="Update Name"
                        value={profileData.name || selectedStudent.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                    <input
                        type="email"
                        placeholder="Update Email"
                        value={profileData.email || selectedStudent.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                    <button onClick={updateProfile}>Update Profile</button>
                </section>
            )}

            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default AdminPanel;
