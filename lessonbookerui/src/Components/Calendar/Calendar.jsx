import React, { useState, useRef, useEffect } from "react";
import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    setHours,
    isWithinInterval,
    areIntervalsOverlapping,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    isToday,
    isSameDay
} from "date-fns";
import "./Calendar.css";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12 AM to 11 PM

export default function DrivingSchoolCalendar({ isInstructor = true, viewMode = "full" }) {
    const [currentView, setCurrentView] = useState("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState([]); // [{ start, end }]
    const [bookings, setBookings] = useState([]); // [{ start, end }]
    const [bookingDuration, setBookingDuration] = useState(1); // in hours

    const currentHourRef = useRef(null);
    const currentHour = new Date().getHours();

    useEffect(() => {
        if (currentHourRef.current && (viewMode === "full" || viewMode === "dashboard")) {
            currentHourRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [viewMode]);

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

        // Check if the booking is within availability
        const isAvailable = availability.some(
            (a) =>
                isWithinInterval(start, { start: a.start, end: a.end }) &&
                isWithinInterval(end, { start: a.start, end: a.end })
        );

        // Check for overlapping bookings
        const isConflict = bookings.some((b) =>
            areIntervalsOverlapping({ start, end }, b)
        );

        // Only allow booking if available and no conflict
        if (isAvailable && !isConflict) {
            setBookings([...bookings, { start, end }]);
        } else {
            alert("This time slot is unavailable or conflicts with another booking.");
        }
    };

    const renderWeekView = () => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

        return (
            <div className={`calendar-grid ${viewMode === "dashboard" ? "dashboard-view" : "full-view"}`}>
                <div className="calendar-header-row">
                    <div className="calendar-time-header"></div>
                    {days.map((day) => {
                        const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                        return (
                            <div
                                key={day}
                                className={`calendar-header-cell ${isToday ? "today" : ""}`}
                            >
                                {format(day, "EEE dd")}
                            </div>
                        );
                    })}
                </div>

                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="calendar-hour-row"
                        ref={hour === currentHour && viewMode === "dashboard" ? currentHourRef : null}
                    >
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
                                        if (isInstructor) {
                                            mergeAvailability({ start, end });
                                        } else if (!isInstructor && (bookingDuration === 1 || bookingDuration === 2)) {
                                            addBooking(start, bookingDuration);
                                        } else {
                                            alert("You can only book a lesson for 1 or 2 hours.");
                                        }
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

    const renderDayView = () => {
        const startOfDay = setHours(selectedDate, 0); // Midnight
        const hoursArray = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="calendar-grid day-view">
                {/* Header row */}
                <div className="calendar-header-row">
                    <div className="calendar-time-header"></div>
                    <div className="calendar-header-cell">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </div>
                </div>

                {/* Scrollable hour rows */}
                <div className="calendar-scrollable">
                    {hoursArray.map((hour) => {
                        const start = setHours(startOfDay, hour);
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
                            <div className="calendar-hour-row" key={hour}>
                                <div className="calendar-time">{hour}:00</div>
                                <div
                                    className={className}
                                    onClick={() => {
                                        if (isInstructor) {
                                            mergeAvailability({ start, end });
                                        } else if (!isInstructor && (bookingDuration === 1 || bookingDuration === 2)) {
                                            addBooking(start, bookingDuration);
                                        } else {
                                            alert("You can only book a lesson for 1 or 2 hours.");
                                        }
                                    }}
                                >
                                    {isBooked ? "Booked" : isAvailable ? "Available" : ""}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const daysInMonth = [];
        const startOfWeekPadding = start.getDay(); // Padding for the first week

        for (let i = 0; i < startOfWeekPadding; i++) {
            daysInMonth.push(null); // Empty slots for padding
        }

        for (let date = start; date <= end; date = addDays(date, 1)) {
            daysInMonth.push(date);
        }

        return (
            <div className="calendar-month-view">
                <div className="calendar-grid calendar-month-grid">
                    {daysInMonth.map((day, index) => {
                        if (!day) {
                            return <div key={index} className="calendar-day empty"></div>;
                        }

                        const isToday = isSameDay(day, new Date());
                        const dayBookings = bookings.filter((b) =>
                            isWithinInterval(day, { start: b.start, end: b.end })
                        );

                        return (
                            <div
                                key={day}
                                className={`calendar-day ${isToday ? "today" : ""}`}
                            >
                                <div className="day-number">{format(day, "d")}</div>
                                <div className="day-events">
                                    {dayBookings.slice(0, 2).map((b, index) => (
                                        <div key={index} className="event">
                                            {format(b.start, "HH:mm")} - {format(b.end, "HH:mm")}
                                        </div>
                                    ))}
                                    {dayBookings.length > 2 && (
                                        <div className="more-events">
                                            +{dayBookings.length - 2} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const handlePrevious = () => {
        if (currentView === "week") {
            setSelectedDate(prev => addDays(prev, -7));
        } else if (currentView === "day") {
            setSelectedDate(prev => addDays(prev, -1));
        } else {
            setSelectedDate(prev => subMonths(prev, 1));
        }
    };

    const handleNext = () => {
        if (currentView === "week") {
            setSelectedDate(prev => addDays(prev, 7));
        } else if (currentView === "day") {
            setSelectedDate(prev => addDays(prev, 1));
        } else {
            setSelectedDate(prev => addMonths(prev, 1));
        }
    };

    const getHeaderTitle = () => {
        if (currentView === "week") {
            const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
        } else if (currentView === "day") {
            return format(selectedDate, "MMMM dd, yyyy");
        } else {
            return format(selectedDate, "MMMM yyyy");
        }
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button className="today-button" onClick={() => setSelectedDate(new Date())}>Today</button>
                <div className="calendar-controls">
                    <button className="nav-arrow" onClick={handlePrevious}>&lt;</button>
                    <h2>{getHeaderTitle()}</h2>
                    <button className="nav-arrow" onClick={handleNext}>&gt;</button>
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
