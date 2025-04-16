import React, { useState } from "react";
import {
    format,
    addDays,
    startOfWeek,
    setHours,
    isWithinInterval,
    areIntervalsOverlapping,
    addMonths,
    subMonths
} from "date-fns";
import "./Calendar.css";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12 AM to 11 PM


export default function DrivingSchoolCalendar({ isInstructor = true, viewMode = "full" }) {
    const [currentView, setCurrentView] = useState("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState([]); // [{ start, end }]
    const [bookings, setBookings] = useState([]); // [{ start, end }]
    const [bookingDuration, setBookingDuration] = useState(1); // in hours

    const mergeAvailability = (newSlot) => {
        const merged = [];
        let added = false;

        [...availability, newSlot].sort((a, b) => a.start - b.start).forEach((slot) => {
            if (!merged.length) {
                merged.push(slot);
            } else {
                const last = merged[merged.length - 1];
                if (slot.start <= last.end) {
                    last.end = new Date(Math.max(last.end, slot.end));
                } else {
                    merged.push(slot);
                }
            }
        });

        setAvailability(merged);
    };

    const addBooking = (start, durationHours) => {
        const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

        const isAvailable = availability.some(
            (a) =>
                isWithinInterval(start, { start: a.start, end: a.end }) &&
                isWithinInterval(end, { start: a.start, end: a.end })
        );
        const isConflict = bookings.some((b) =>
            areIntervalsOverlapping({ start, end }, b)
        );

        if (isAvailable && !isConflict) {
            setBookings([...bookings, { start, end }]);
        }
    };

    const renderWeekView = () => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

        return (
            <div className={`calendar-grid ${viewMode === "dashboard" ? "dashboard-view" : "full-view"}`}>
                <div className="calendar-header-row">
                    <div className="calendar-time-header"></div>
                    {days.map((day) => (
                        <div key={day} className="calendar-header-cell">
                            {format(day, "EEE dd")}
                        </div>
                    ))}
                </div>

                {HOURS.map((hour) => (
                    <div key={hour} className="calendar-hour-row">
                        <div className="calendar-time">{hour}:00</div>
                        {days.map((day) => {
                            const start = setHours(new Date(day), hour);
                            const end = new Date(start.getTime() + 60 * 60 * 1000);

                            const isBooked = bookings.some((b) =>
                                areIntervalsOverlapping({ start, end }, b)
                            );
                            const isAvailable = availability.some(
                                (a) =>
                                    isWithinInterval(start, { start: a.start, end: a.end }) &&
                                    isWithinInterval(end, { start: a.start, end: a.end })
                            );

                            let className = "calendar-slot";
                            if (isBooked) className += " booked";
                            else if (isAvailable) className += " available";

                            return (
                                <div
                                    key={`${day}-${hour}`}
                                    className={className}
                                    onClick={() => {
                                        if (isInstructor) mergeAvailability({ start, end });
                                        else addBooking(start, bookingDuration);
                                    }}
                                >
                                    {isBooked ? "Booked" : isAvailable ? "Available" : ""}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    const handlePreviousMonth = () => {
        setSelectedDate(subMonths(selectedDate, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(addMonths(selectedDate, 1));
    };

    console.log("View Mode:", viewMode);


    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button className="today-button" onClick={() => setSelectedDate(new Date())}>Today</button>
                <div className="calendar-controls">
                    <button onClick={handlePreviousMonth}>&lt;</button>
                    <h2>{format(selectedDate, "MMMM yyyy")}</h2>
                    <button onClick={handleNextMonth}>&gt;</button>
                </div>
                <div className="calendar-view-options">
                    <button
                        className={`view-button ${currentView === "day" ? "active" : ""}`}
                        onClick={() => setCurrentView("day")}
                    >
                        Day
                    </button>
                    <button
                        className={`view-button ${currentView === "week" ? "active" : ""}`}
                        onClick={() => setCurrentView("week")}
                    >
                        Week
                    </button>
                    <button
                        className={`view-button ${currentView === "month" ? "active" : ""}`}
                        onClick={() => setCurrentView("month")}
                    >
                        Month
                    </button>
                </div>
            </div>

            {currentView === "week" && renderWeekView()}
        </div>
    );
}