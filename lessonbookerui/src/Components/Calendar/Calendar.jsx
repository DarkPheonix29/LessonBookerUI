import React, { useState } from "react";
import {
    format,
    addDays,
    startOfWeek,
    setHours,
    isWithinInterval,
    areIntervalsOverlapping,
} from "date-fns";
import "./Calendar.css";

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

export default function DrivingSchoolCalendar({ isInstructor = true }) {
    const [currentView, setCurrentView] = useState("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState([]); // [{ start, end }]
    const [bookings, setBookings] = useState([]); // [{ start, end }]
    const [bookingDuration, setBookingDuration] = useState(1); // in hours

    const mergeAvailability = (newSlot) => {
        const merged = [];
        let added = false;

        [...availability, newSlot].sort((a, b) => a.start - b.start).forEach(slot => {
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
            (a) => isWithinInterval(start, { start: a.start, end: a.end }) &&
                isWithinInterval(end, { start: a.start, end: a.end })
        );
        const isConflict = bookings.some(
            (b) => areIntervalsOverlapping({ start, end }, b)
        );

        if (isAvailable && !isConflict) {
            setBookings([...bookings, { start, end }]);
        }
    };

    const renderWeekView = () => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

        return (
            <div className="grid-container">
                <div className="grid-header"></div>
                {days.map((day) => (
                    <div key={day} className="grid-header">
                        {format(day, "EEE dd")}
                    </div>
                ))}
                {HOURS.map((hour) => (
                    <React.Fragment key={hour}>
                        <div className="grid-time">{hour}:00</div>
                        {days.map((day) => {
                            const start = setHours(new Date(day), hour);
                            const end = new Date(start.getTime() + 60 * 60 * 1000);

                            const isBooked = bookings.some((b) => areIntervalsOverlapping({ start, end }, b));
                            const isAvailable = availability.some((a) => isWithinInterval(start, { start: a.start, end: a.end }) && isWithinInterval(end, { start: a.start, end: a.end }));

                            let className = "time-slot";
                            if (isBooked) className += " bg-red-400";
                            else if (isAvailable) className += " bg-green-300";

                            return (
                                <div
                                    key={day + "-" + hour}
                                    className={className}
                                    onClick={() => {
                                        if (isInstructor) mergeAvailability({ start, end });
                                        else addBooking(start, bookingDuration);
                                    }}
                                >
                                    {format(start, "HH:mm")}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <div className="space-x-2">
                    <button className="calendar-button" onClick={() => setCurrentView("day")}>Day</button>
                    <button className="calendar-button" onClick={() => setCurrentView("week")}>Week</button>
                    <button className="calendar-button" onClick={() => setCurrentView("month")}>Month</button>
                </div>
                <h2>{format(selectedDate, "PPP")}</h2>
                {!isInstructor && (
                    <div>
                        <label className="mr-2 text-sm">Duration:</label>
                        <select
                            value={bookingDuration}
                            onChange={(e) => setBookingDuration(Number(e.target.value))}
                            className="border p-1 rounded"
                        >
                            <option value={1}>1 Hour</option>
                            <option value={2}>2 Hours</option>
                        </select>
                    </div>
                )}
            </div>

            {currentView === "week" && renderWeekView()}
            {/* Add Day and Month views as needed */}
        </div>
    );
}
