import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";
import Calendar from "../../Components/Calendar/Calendar"; // Import the Calendar component

const InstructorDashboard = () => {
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
                <section className="text-center text-[#6ce5ff] text-3xl font-normal max-w-xl">
                    <h1>Welcome back, Instructor {userEmail}!</h1>
                    <p className="text-black font-bold text-xl mt-2">Your next lesson is: 2 PM, October 3rd</p>
                </section>

                <section className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Set Your Availability</h2>
                    <a href="/instructorcalendar" className="text-blue-600 underline">View full calendar</a>
                </section>

                <div className="w-full max-w-[932px] h-[225px] border border-gray-300 mt-4 relative">
                    {/* Calendar component embedded */}
                    <Calendar isInstructor={true} viewMode="dashboard" />
                </div>
            </main>
        </div>
    );
};

export default InstructorDashboard;
