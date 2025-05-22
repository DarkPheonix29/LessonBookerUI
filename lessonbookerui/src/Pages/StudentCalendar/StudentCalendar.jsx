import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";
import Calendar from "../../Components/Calendar/Calendar";
import axios from 'axios';
import "./StudentCalendar.css";
import API_BASE_URL from "../../Components/API/API";

const StudentCalendar = () => {
    const auth = getAuth();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const userEmail = user?.email || "Student";
    const [displayName, setDisplayName] = useState("Student");
    const [nextLesson, setNextLesson] = useState(null);

    useEffect(() => {
        if (userEmail) {
            axios.get(`${API_BASE_URL}/api/profile/${userEmail}`)
                .then(res => setDisplayName(res.data.displayName || userEmail))
                .catch(() => setDisplayName(userEmail));

            axios.get(`${API_BASE_URL}/api/booking/student/${userEmail}`)
                .then(res => {
                    const now = new Date();
                    const upcoming = res.data
                        .map(b => ({ ...b, start: new Date(b.start) }))
                        .filter(b => b.start > now)
                        .sort((a, b) => a.start - b.start);
                    setNextLesson(upcoming.length > 0 ? upcoming[0] : null);
                });
        }
    }, [userEmail]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="student-calendar-root min-h-screen flex flex-col items-center justify-start pt-[52.5px] bg-white overflow-hidden">
            <Header variant="dashboard" displayName={displayName} onLogout={handleLogout} />
            <main className="w-full flex flex-col items-center justify-start px-4 mt-10">
                <section className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Full Calendar View</h2>
                </section>
                <div className="w-full max-w-[932px] h-[auto] mt-4">
                    <Calendar isInstructor={false} viewMode="full" studentEmail={userEmail} />
                </div>
            </main>
        </div>
    );
};

export default StudentCalendar;