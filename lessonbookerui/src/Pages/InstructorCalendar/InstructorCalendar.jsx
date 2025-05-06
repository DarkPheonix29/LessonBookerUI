import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";
import Calendar from "../../Components/Calendar/Calendar"; // Import the Calendar component

const InstructorCalendar = () => {
    const auth = getAuth();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const userEmail = user?.email || "Instructor";

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-[52.5px] bg-white overflow-hidden">
            {/* Header using the shared component */}
            <Header variant="dashboard" userEmail={userEmail} onLogout={handleLogout} />

            {/* Main content */}
            <main className="w-full flex flex-col items-center justify-start px-4 mt-10">
                <section className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Full Calendar View</h2>
                </section>

                {/* Full calendar component view */}
                <div className="w-full max-w-[932px] h-[auto] mt-4">
                    <Calendar isInstructor={true} viewMode="full" />
                </div>
            </main>
        </div>
    );
};

export default InstructorCalendar;
