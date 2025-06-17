import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";
import Calendar from "../../Components/Calendar/Calendar";
import axios from "axios";
import "./StudentDashboard.css";
import API_BASE_URL from "../../Components/API/API";

// Helper to get the Authorization header
const getAuthHeader = () => {
    const idToken = localStorage.getItem("idToken");
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
};

const StudentDashboard = () => {
    const auth = getAuth();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const userEmail = user?.email ?? "Student";
    const [displayName, setDisplayName] = useState("Student");
    const [nextLesson, setNextLesson] = useState(null);

    useEffect(() => {
        if (userEmail) {
            // Fetch display name
            axios
                .get(`${API_BASE_URL}/api/profile/${userEmail}`, {
                    headers: getAuthHeader(),
                })
                .then((res) => setDisplayName(res.data.displayName || userEmail))
                .catch(() => setDisplayName(userEmail));

            // Fetch next lesson
            axios
                .get(`${API_BASE_URL}/api/booking/student/${userEmail}`, {
                    headers: getAuthHeader(),
                })
                .then((res) => {
                    const now = Date.now();
                    const upcoming = res.data
                        .map((b) => ({ ...b, start: new Date(b.start) }))
                        .filter((b) => b.start.getTime() > now)
                        .sort((a, b) => a.start - b.start);
                    setNextLesson(upcoming.length > 0 ? upcoming[0] : null);
                })
                .catch(() => setNextLesson(null));
        }
    }, [userEmail]);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("idToken");
        navigate("/");
    };

    return (
        <div className="student-dashboard-root min-h-screen flex flex-col items-center pt-[52.5px] bg-white">
            <Header variant="dashboard" displayName={displayName} onLogout={handleLogout} />
            <main className="w-full flex flex-col items-center px-4 mt-10">
                <section className="text-center text-3xl font-medium max-w-xl">
                    <h1>Welcome back, {displayName}!</h1>
                    <p className="font-bold text-xl mt-2">
                        Your next lesson is:{" "}
                        <span className="text-[#6ce5ff]">
                            {nextLesson
                                ? `${nextLesson.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, ${nextLesson.start.toLocaleDateString()}`
                                : "No upcoming lessons"}
                        </span>
                    </p>
                    {nextLesson && (
                        <div style={{ marginTop: 8, fontSize: "1rem", color: "#222" }}>
                            <b>Instructor:</b>{" "}
                            {nextLesson.instructorDisplayName ||
                                nextLesson.instructorName ||
                                nextLesson.instructorEmail ||
                                "Unknown"}
                        </div>
                    )}
                </section>
                <section className="mt-6 text-center">
                    <h2 className="text-xl font-semibold mb-2">Schedule your next lesson!</h2>
                    <a
                        href="/studentcalendar"
                        className="text-blue-600 underline hover:text-blue-800 transition-colors"
                    >
                        View full calendar
                    </a>
                </section>
                <div className="w-full max-w-[932px] h-[225px] border border-gray-300 mt-6 rounded-lg shadow-sm overflow-hidden">
                    <Calendar isInstructor={false} viewMode="dashboard" studentEmail={userEmail} instructorEmail={null} />
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
