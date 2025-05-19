import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";
import Calendar from "../../Components/Calendar/Calendar";
import axios from "axios";
import "./InstructorDashboard.css";

const InstructorDashboard = () => {
    const auth = getAuth();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const userEmail = user?.email || "Instructor";
    const [displayName, setDisplayName] = useState("Instructor");

    useEffect(() => {
        if (userEmail) {
            axios.get(`/api/profile/${userEmail}`)
                .then(res => setDisplayName(res.data.displayName || userEmail))
                .catch(() => setDisplayName(userEmail));
        }
    }, [userEmail]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="instructor-dashboard-root min-h-screen flex flex-col items-center justify-start pt-[52.5px] bg-white overflow-hidden">
            <Header variant="dashboard" displayName={displayName} onLogout={handleLogout} />
            <main className="w-full flex flex-col items-center justify-start px-4 mt-10">
                <section className="text-center text-[#6ce5ff] text-3xl font-normal max-w-xl">
                    <h1>Welcome back, {displayName}!</h1>
                </section>
                <section className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Set Your Availability</h2>
                    <a href="/instructorcalendar" className="text-blue-600 underline">View full calendar</a>
                </section>
                <div className="w-full max-w-[932px] h-[225px] border border-gray-300 mt-4 relative">
                    <Calendar isInstructor={true} viewMode="dashboard" instructorEmail={userEmail} />
                </div>
            </main>
        </div>
    );
};

export default InstructorDashboard;