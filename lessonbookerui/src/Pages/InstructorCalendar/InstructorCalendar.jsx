import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";
import Calendar from "../../Components/Calendar/Calendar";
import axios from 'axios';
import "./InstructorCalendar.css";
import API_BASE_URL from "../../Components/API/API";

const InstructorCalendar = () => {
    const auth = getAuth();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const userEmail = user?.email || "Instructor";
    const [displayName, setDisplayName] = useState("Instructor");

    useEffect(() => {
        if (userEmail) {
            axios.get(`${API_BASE_URL}/api/profile/${userEmail}`)
                .then(res => setDisplayName(res.data.displayName || userEmail))
                .catch(() => setDisplayName(userEmail));
        }
    }, [userEmail]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="instructor-calendar-root min-h-screen flex flex-col items-center justify-start pt-[52.5px] bg-white overflow-hidden">
            <Header variant="dashboard" displayName={displayName} onLogout={handleLogout} />
            <main className="w-full flex flex-col items-center justify-start px-4 mt-10">
                <section className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Full Calendar View</h2>
                </section>
                <div className="w-full max-w-[932px] h-[auto] mt-4">
                    <Calendar isInstructor={true} viewMode="full" instructorEmail={userEmail} />
                </div>
            </main>
        </div>
    );
};

export default InstructorCalendar;