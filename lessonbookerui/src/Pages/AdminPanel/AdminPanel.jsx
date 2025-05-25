import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";
import API_BASE_URL from "../../Components/API/API";

// Helper to get the Authorization header
const getAuthHeader = () => {
    const idToken = localStorage.getItem("idToken");
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
};

const AdminPanel = () => {
    const [students, setStudents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [newKey, setNewKey] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [profileData, setProfileData] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("students");

    const auth = getAuth();
    const navigate = useNavigate();

    // Fetch all students
    useEffect(() => {
        if (activeTab === "students") {
            setLoading(true);
            axios.get(`${API_BASE_URL}/api/admin/students`, {
                headers: getAuthHeader(),
            })
                .then(response => setStudents(response.data))
                .catch(() => setMessage("Failed to fetch students"))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Fetch all bookings
    useEffect(() => {
        if (activeTab === "bookings") {
            setLoading(true);
            axios.get(`${API_BASE_URL}/api/booking/all-bookings`, {
                headers: getAuthHeader(),
            })
                .then(response => setBookings(response.data))
                .catch(() => setMessage("Failed to fetch bookings"))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Handle key generation
    const generateKey = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/admin/generate-key`, {}, {
                headers: getAuthHeader(),
            });
            const keysRes = await axios.get(`${API_BASE_URL}/api/admin/keys`, {
                headers: getAuthHeader(),
            });
            const keys = keysRes.data;
            const latestKeyObj = keys && keys.length > 0 ? keys[keys.length - 1] : null;
            setNewKey(latestKeyObj ? latestKeyObj.key : "");
            setMessage("New registration key generated successfully.");
        } catch {
            setMessage("Failed to generate key.");
        }
    };

    // Handle logout
    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("idToken");
        navigate("/");
    };

    // Handle revoking student access
    const revokeAccess = async (uid) => {
        if (!uid) {
            setMessage("Invalid student UID.");
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/admin/revoke-access/${uid}`, {}, {
                headers: getAuthHeader(),
            });
            setMessage("Access revoked successfully.");
            setStudents(students.filter(student => student.uid !== uid));
        } catch {
            setMessage("Failed to revoke access.");
        }
    };

    // Handle profile update
    const updateProfile = async () => {
        // Merge selectedStudent and profileData, profileData takes precedence
        const fullProfile = { ...selectedStudent, ...profileData };
        try {
            await axios.put(`${API_BASE_URL}/api/admin/update-profile`, fullProfile, {
                headers: getAuthHeader(),
            });
            setMessage("Profile updated successfully.");
            setProfileData({});
            setSelectedStudent(null);
        } catch {
            setMessage("Failed to update profile.");
        }
    };


    // Handle booking removal
    const removeBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to remove this booking?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/booking/${bookingId}`, {
                headers: getAuthHeader(),
            });
            setBookings(bookings.filter(b => b.id !== bookingId && b.bookingId !== bookingId));
            setMessage("Booking removed successfully.");
        } catch {
            setMessage("Failed to remove booking.");
        }
    };

    return (
        <div className="admin-panel-bg">
            <nav className="admin-navbar">
                <div className="admin-navbar-left">
                    <span
                        className={`admin-nav-item${activeTab === "students" ? " active" : ""}`}
                        onClick={() => setActiveTab("students")}
                    >
                        Students
                    </span>
                    <span
                        className={`admin-nav-item${activeTab === "bookings" ? " active" : ""}`}
                        onClick={() => setActiveTab("bookings")}
                    >
                        Bookings
                    </span>
                </div>
                <button className="admin-btn logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </nav>
            <div className="admin-panel">
                <h1>Admin Panel</h1>

                {activeTab === "students" && (
                    <>
                        <section className="admin-section">
                            <h2>Generate Registration Key</h2>
                            <div className="admin-key-row">
                                <button className="admin-btn" onClick={generateKey}>Generate Key</button>
                                {newKey && <span className="admin-key">{newKey}</span>}
                            </div>
                        </section>

                        <section className="admin-section">
                            <h2>Current Students</h2>
                            {loading ? <p>Loading...</p> : (
                                <ul className="admin-list">
                                    {students.map((student) => (
                                        <li key={student.uid || student.email} className="admin-list-item">
                                            <div>
                                                <strong>{student.Email}</strong> <span className="admin-email">({student.email})</span>
                                            </div>
                                            <div className="admin-actions">
                                                <button className="admin-btn" onClick={() => setSelectedStudent(student)}>Update Profile</button>
                                                {student.uid && (
                                                    <button
                                                        className="admin-btn danger"
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to revoke access for ${student.DisplayName || student.Email}?`)) {
                                                                revokeAccess(student.uid);
                                                            }
                                                        }}
                                                    >
                                                        Revoke Access
                                                    </button>

                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {selectedStudent && (
                            <section className="admin-section">
                                <h2>Update Profile for {selectedStudent.DisplayName || selectedStudent.Email}</h2>
                                {Object.keys(selectedStudent)
                                    .filter(
                                        (key) =>
                                            key !== "uid" && // Don't allow editing uid
                                            key !== "ProfileId" && // Optionally skip ProfileId if you don't want it editable
                                            typeof selectedStudent[key] !== "object" // Skip nested objects/arrays
                                    )
                                    .map((key) => (
                                        <div key={key} style={{ marginBottom: 10 }}>
                                            <label style={{ marginRight: 8, minWidth: 120, display: "inline-block" }}>
                                                {key}:
                                            </label>
                                            <input
                                                type={key.toLowerCase().includes("email") ? "email" : "text"}
                                                placeholder={`Update ${key}`}
                                                value={
                                                    profileData[key] !== undefined
                                                        ? profileData[key]
                                                        : selectedStudent[key] !== null && selectedStudent[key] !== undefined
                                                            ? selectedStudent[key]
                                                            : ""
                                                }
                                                onChange={(e) =>
                                                    setProfileData({ ...profileData, [key]: e.target.value })
                                                }
                                                style={{ minWidth: 200 }}
                                            />
                                        </div>
                                    ))}
                                <button className="admin-btn" onClick={updateProfile}>
                                    Update Profile
                                </button>
                                <button className="admin-btn" onClick={() => setSelectedStudent(null)}>
                                    Cancel
                                </button>
                            </section>

                        )}
                    </>
                )}

                {activeTab === "bookings" && (
                    <section className="admin-section">
                        <h2>All Bookings</h2>
                        <div className="admin-bookings-scroll">
                            {loading ? <p>Loading...</p> : (
                                <ul className="admin-list">
                                    {bookings.length === 0 && <li>No bookings found.</li>}
                                    {bookings.map((b) => (
                                        <li key={b.id || b.bookingId} className="admin-list-item">
                                            <div>
                                                <b>{b.studentDisplayName || b.studentName || b.studentEmail}</b>
                                                {" with "}
                                                <b>{b.instructorDisplayName || b.instructorName || b.instructorEmail}</b>
                                                <br />
                                                <span>
                                                    {new Date(b.start).toLocaleString()} - {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="admin-actions">
                                                <button className="admin-btn danger" onClick={() => removeBooking(b.id || b.bookingId)}>
                                                    Remove Booking
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                )}

                {message && <p className="admin-message">{message}</p>}
            </div>
        </div>
    );
};

export default AdminPanel;
