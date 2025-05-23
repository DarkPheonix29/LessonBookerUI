import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
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
    isSameDay,
    isSameDay as isSameDayDateFns
} from "date-fns";
import "./Calendar.css";
import API_BASE_URL from "../../Components/API/API";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Helper to get the Authorization header
const getAuthHeader = () => {
    const idToken = localStorage.getItem("idToken");
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
};

export default function DrivingSchoolCalendar({ isInstructor = true, viewMode = "full", instructorEmail, studentEmail }) {
    const [currentView, setCurrentView] = useState("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [bookingDuration, setBookingDuration] = useState(1);

    // Modal state for instructor availability
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [availabilityStart, setAvailabilityStart] = useState(null);

    // Modal state for student booking
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingStart, setBookingStart] = useState(null);

    // Modal state for booked lesson details
    const [showBookedModal, setShowBookedModal] = useState(false);
    const [bookedLessonDetails, setBookedLessonDetails] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState(null);

    const currentHourRef = useRef(null);
    const currentHour = new Date().getHours();

    useEffect(() => {
        if (isInstructor) {
            axios.get(`${API_BASE_URL}/api/availability/${instructorEmail}`, {
                headers: getAuthHeader(),
            })
                .then(response => {
                    const parsed = response.data.map(a => ({
                        ...a,
                        start: new Date(a.start),
                        end: new Date(a.end)
                    }));
                    setAvailability(parsed);
                })
                .catch(error => console.error("Error fetching availability:", error));

            axios.get(`${API_BASE_URL}/api/booking/instructor/${instructorEmail}`, {
                headers: getAuthHeader(),
            })
                .then(response => {
                    const parsed = response.data.map(b => ({
                        ...b,
                        start: new Date(b.start),
                        end: new Date(b.end),
                        studentDisplayName: b.studentDisplayName || b.studentName || b.studentEmail,
                        studentEmail: b.studentEmail
                    }));
                    setBookings(parsed);
                })
                .catch(error => console.error("Error fetching bookings:", error));
        } else {
            axios.get(`${API_BASE_URL}/api/availability/all-availability`, {
                headers: getAuthHeader(),
            })
                .then(response => {
                    const parsed = response.data.map(a => ({
                        ...a,
                        start: new Date(a.start),
                        end: new Date(a.end)
                    }));
                    setAvailability(parsed);
                })
                .catch(error => console.error("Error fetching all instructors' availability:", error));

            axios.get(`${API_BASE_URL}/api/booking/all-bookings`, {
                headers: getAuthHeader(),
            })
                .then(response => {
                    const parsed = response.data.map(b => ({
                        ...b,
                        start: new Date(b.start),
                        end: new Date(b.end),
                        studentDisplayName: b.studentDisplayName || b.studentName || b.studentEmail,
                        studentEmail: b.studentEmail
                    }));
                    setBookings(parsed);
                })
                .catch(error => console.error("Error fetching bookings:", error));
        }
    }, [instructorEmail, studentEmail, isInstructor]);

    const addNewAvailability = (start, end) => {
        const newAvailability = {
            instructorEmail,
            start: start.toISOString(),
            end: end.toISOString()
        };

        axios.post(`${API_BASE_URL}/api/availability`, newAvailability, {
            headers: getAuthHeader(),
        })
            .then(response => {
                const added = {
                    ...response.data,
                    start: new Date(response.data.start),
                    end: new Date(response.data.end)
                };
                setAvailability(prev => [...prev, added]);
            })
            .catch(error => console.error("Error adding availability:", error));
    };

    // Remove a single hour from an availability slot (splitting if needed)
    const removeAvailabilityHour = (slotStart, slotEnd) => {
        const containing = availability.find(a =>
            isWithinInterval(slotStart, { start: a.start, end: a.end }) &&
            isWithinInterval(slotEnd, { start: a.start, end: a.end })
        );
        if (!containing) return;

        if (!window.confirm("Are you sure you want to remove this hour from your availability?")) return;

        if (containing.start.getTime() === slotStart.getTime() && containing.end.getTime() === slotEnd.getTime()) {
            axios.delete(`${API_BASE_URL}/api/availability/${parseInt(containing.availabilityId || containing.id, 10)}`, {
                headers: getAuthHeader(),
            })
                .then(() => {
                    setAvailability(prev => prev.filter(a => a !== containing));
                })
                .catch(error => alert("Failed to remove availability: " + error));
            return;
        }

        const updates = [];
        if (containing.start < slotStart) {
            updates.push({
                instructorEmail,
                start: containing.start.toISOString(),
                end: slotStart.toISOString()
            });
        }
        if (containing.end > slotEnd) {
            updates.push({
                instructorEmail,
                start: slotEnd.toISOString(),
                end: containing.end.toISOString()
            });
        }

        axios.delete(`${API_BASE_URL}/api/availability/${parseInt(containing.availabilityId || containing.id, 10)}`, {
            headers: getAuthHeader(),
        })
            .then(() => {
                Promise.all(
                    updates.map(u =>
                        axios.post(`${API_BASE_URL}/api/availability`, u, {
                            headers: getAuthHeader(),
                        })
                            .then(res => ({
                                ...res.data,
                                start: new Date(res.data.start),
                                end: new Date(res.data.end)
                            }))
                    )
                ).then(newSlots => {
                    setAvailability(prev =>
                        prev.filter(a => a !== containing).concat(newSlots)
                    );
                });
            })
            .catch(error => alert("Failed to update availability: " + error));
    };

    const addBooking = (start, durationHours) => {
        if (![1, 2].includes(durationHours)) {
            alert("You can only book a lesson for 1 or 2 hours.");
            return;
        }

        // Only check for bookings by the current user
        const alreadyBooked = bookings.some(
            b => b.studentEmail === studentEmail && isSameDayDateFns(b.start, start)
        );
        if (alreadyBooked) {
            alert("You can only book one lesson per day.");
            return;
        }

        const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

        const matchingAvailability = availability.find(a =>
            isWithinInterval(start, { start: a.start, end: a.end }) &&
            isWithinInterval(end, { start: a.start, end: a.end })
        );

        if (!matchingAvailability) {
            alert("The selected time is outside the instructor's available hours.");
            return;
        }

        const isConflict = bookings.some(b =>
            areIntervalsOverlapping({ start, end }, { start: b.start, end: b.end })
        );

        if (isConflict) {
            alert("This time slot conflicts with another booking.");
            return;
        }

        const newBooking = {
            studentEmail,
            instructorEmail: matchingAvailability.instructorEmail,
            start: start.toISOString(),
            end: end.toISOString()
        };

        axios.post(`${API_BASE_URL}/api/booking`, newBooking, {
            headers: getAuthHeader(),
        })
            .then(response => {
                const added = {
                    ...response.data,
                    start: new Date(response.data.start),
                    end: new Date(response.data.end),
                    studentDisplayName: response.data.studentDisplayName || response.data.studentName || response.data.studentEmail,
                    studentEmail: response.data.studentEmail
                };
                setBookings(prev => [...prev, added]);
            })
            .catch(error => console.error("Error adding booking:", error));
    };


    // Booked lesson modal logic
    const handleBookedSlotClick = async (booking) => {
        setProfileLoading(true);
        setProfileError(null);
        setShowBookedModal(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/profile/${booking.studentEmail}`, {
                headers: getAuthHeader(),
            });
            setBookedLessonDetails({
                ...booking,
                pickupAddress: res.data.pickupAddress || "Unknown",
                displayName: res.data.displayName || booking.studentDisplayName || booking.studentEmail
            });
        } catch (err) {
            setProfileError("Could not load student profile.");
            setBookedLessonDetails({
                ...booking,
                pickupAddress: "Unknown",
                displayName: booking.studentDisplayName || booking.studentEmail
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const renderBookedLessonModal = () => (
        <div className="calendar-modal-backdrop">
            <div className="calendar-modal">
                <h3 style={{ color: "#111" }}>Lesson Details</h3>
                {profileLoading ? (
                    <div>Loading...</div>
                ) : profileError ? (
                    <div style={{ color: "red" }}>{profileError}</div>
                ) : bookedLessonDetails ? (
                    <>
                        <p><b>Student:</b> {bookedLessonDetails.displayName}</p>
                        <p><b>Pickup Address:</b> {bookedLessonDetails.pickupAddress}</p>
                        <p>
                            <b>Start:</b> {format(new Date(bookedLessonDetails.start), "PPpp")}
                            <br />
                            <b>End:</b> {format(new Date(bookedLessonDetails.end), "PPpp")}
                        </p>
                    </>
                ) : null}
                <button
                    className="view-button"
                    style={{ marginTop: 12, color: "#00cfff" }}
                    onClick={() => setShowBookedModal(false)}
                >
                    Close
                </button>
            </div>
        </div>
    );

    const handlePrevious = () => {
        if (currentView === "week") setSelectedDate(prev => addDays(prev, -7));
        else if (currentView === "day") setSelectedDate(prev => addDays(prev, -1));
        else setSelectedDate(prev => subMonths(prev, 1));
    };

    const handleNext = () => {
        if (currentView === "week") setSelectedDate(prev => addDays(prev, 7));
        else if (currentView === "day") setSelectedDate(prev => addDays(prev, 1));
        else setSelectedDate(prev => addMonths(prev, 1));
    };

    const getHeaderTitle = () => {
        if (currentView === "week") {
            const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
        } else if (currentView === "day") return format(selectedDate, "MMMM dd, yyyy");
        else return format(selectedDate, "MMMM yyyy");
    };

    // Modal for instructor to set end time for availability
    const renderAvailabilityModal = () => (
        <div className="calendar-modal-backdrop">
            <div className="calendar-modal">
                <h3 style={{ color: "#111" }}>Set Availability</h3>
                <p style={{ color: "#111" }}>
                    From: <b>{availabilityStart && format(availabilityStart, "HH:mm, MMM d")}</b>
                </p>
                <label style={{ color: "#111" }}>
                    Until:
                    <select
                        style={{
                            color: "#111",
                            marginLeft: 8,
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #6ce5ff",
                            background: "#fff"
                        }}
                        onChange={e => {
                            if (!availabilityStart) return;
                            const [h, m] = e.target.value.split(":");
                            const end = new Date(availabilityStart);
                            end.setHours(Number(h), Number(m), 0, 0);
                            if (end > availabilityStart) {
                                addNewAvailability(availabilityStart, end);
                                setShowAvailabilityModal(false);
                                setAvailabilityStart(null);
                            } else {
                                alert("End time must be after start time.");
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>
                            --:--
                        </option>
                        {(() => {
                            if (!availabilityStart) return null;
                            const options = [];
                            let hour = availabilityStart.getHours();
                            let minute = availabilityStart.getMinutes();
                            if (minute < 30) {
                                minute = 30;
                            } else {
                                hour += 1;
                                minute = 0;
                            }
                            while (hour < 24) {
                                const timeStr = `${hour.toString().padStart(2, "0")}:${minute === 0 ? "00" : "30"}`;
                                options.push(
                                    <option key={timeStr} value={timeStr}>
                                        {timeStr}
                                    </option>
                                );
                                if (minute === 0) {
                                    minute = 30;
                                } else {
                                    minute = 0;
                                    hour += 1;
                                }
                            }
                            return options;
                        })()}
                    </select>
                </label>
                <button
                    className="view-button"
                    style={{ marginTop: 12, color: "#00cfff" }}
                    onClick={() => {
                        setShowAvailabilityModal(false);
                        setAvailabilityStart(null);
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    // Modal for student to choose booking duration
    const renderBookingModal = () => (
        <div className="calendar-modal-backdrop">
            <div className="calendar-modal">
                <h3 style={{ color: "#111" }}>Book Lesson</h3>
                <p style={{ color: "#111" }}>
                    Start: <b>{bookingStart && format(bookingStart, "HH:mm, MMM d")}</b>
                </p>
                <div style={{ margin: "16px 0" }}>
                    <button
                        className="view-button"
                        style={{ color: "#111", marginRight: 10 }}
                        onClick={() => {
                            addBooking(bookingStart, 1);
                            setShowBookingModal(false);
                            setBookingStart(null);
                        }}
                    >
                        1 Hour
                    </button>
                    <button
                        className="view-button"
                        style={{ color: "#111" }}
                        onClick={() => {
                            addBooking(bookingStart, 2);
                            setShowBookingModal(false);
                            setBookingStart(null);
                        }}
                    >
                        2 Hours
                    </button>
                </div>
                <button
                    className="view-button"
                    style={{ marginTop: 12, color: "#00cfff" }}
                    onClick={() => {
                        setShowBookingModal(false);
                        setBookingStart(null);
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    // Helper: get the booking for a slot if it exists
    const getBookingForSlot = (start, end) =>
        bookings.find(b => areIntervalsOverlapping({ start, end }, { start: b.start, end: b.end }));

    // BookedInfoButton REMOVED

    const renderWeekView = () => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

        return (
            <div className={`calendar-grid ${viewMode === "dashboard" ? "dashboard-view" : "full-view"}`}>
                <div className="calendar-header-row">
                    <div className="calendar-time-header"></div>
                    {days.map((day) => (
                        <div
                            key={day}
                            className={`calendar-header-cell ${isSameDay(day, new Date()) ? "today" : ""}`}
                        >
                            {format(day, "EEE dd")}
                        </div>
                    ))}
                </div>

                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className={`calendar-hour-row ${hour === currentHour && isToday(selectedDate) ? "current-hour" : ""}`}
                        ref={hour === currentHour && isToday(selectedDate) ? currentHourRef : null}
                    >
                        <div className="calendar-time">{hour}:00</div>
                        {days.map((day) => {
                            const start = setHours(new Date(day), hour);
                            const end = new Date(start.getTime() + 60 * 60 * 1000);
                            const booking = getBookingForSlot(start, end);
                            const isBooked = !!booking;
                            let isAvailable = false;
                            if (!isBooked) {
                                isAvailable = availability.some(
                                    a =>
                                        isWithinInterval(start, { start: a.start, end: a.end }) &&
                                        isWithinInterval(end, { start: a.start, end: a.end })
                                );
                            }

                            let className = "calendar-slot";
                            if (isBooked) className += " booked";
                            else if (isAvailable) className += " available";
                            if (isBooked && !isInstructor) className += " unclickable";

                            return (
                                <div
                                    key={`${day}-${hour}`}
                                    className={className}
                                    style={{ position: "relative" }}
                                    onClick={() => {
                                        if (isBooked && isInstructor) {
                                            handleBookedSlotClick(booking);
                                            return;
                                        }
                                        if (isInstructor && !isBooked) {
                                            const containing = availability.find(a =>
                                                isWithinInterval(start, { start: a.start, end: a.end }) &&
                                                isWithinInterval(end, { start: a.start, end: a.end })
                                            );
                                            if (containing) {
                                                removeAvailabilityHour(start, end);
                                            } else {
                                                setAvailabilityStart(start);
                                                setShowAvailabilityModal(true);
                                            }
                                        } else if (!isInstructor && isAvailable) {
                                            const alreadyBooked = bookings.some(b => isSameDayDateFns(b.start, start));
                                            if (alreadyBooked) {
                                                alert("You can only book one lesson per day.");
                                                return;
                                            }
                                            setBookingStart(start);
                                            setShowBookingModal(true);
                                        }
                                    }}
                                >
                                    {isBooked
                                        ? isInstructor
                                            ? (booking.studentDisplayName || booking.studentEmail)
                                            : "Booked"
                                        : isAvailable
                                            ? isInstructor
                                                ? "Available"
                                                : ""
                                            : ""}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    const renderDayView = () => {
        const startOfDay = setHours(selectedDate, 0);

        return (
            <div className="calendar-grid day-view">
                <div className="calendar-header-row">
                    <div className="calendar-time-header"></div>
                    <div className="calendar-header-cell">{format(selectedDate, "EEEE, MMMM d, yyyy")}</div>
                </div>

                <div className="calendar-scrollable">
                    {HOURS.map((hour) => {
                        const start = setHours(startOfDay, hour);
                        const end = new Date(start.getTime() + 60 * 60 * 1000);
                        const booking = getBookingForSlot(start, end);
                        const isBooked = !!booking;
                        let isAvailable = false;
                        if (!isBooked) {
                            isAvailable = availability.some(
                                a =>
                                    isWithinInterval(start, { start: a.start, end: a.end }) &&
                                    isWithinInterval(end, { start: a.start, end: a.end })
                            );
                        }

                        let className = "calendar-slot";
                        if (isBooked) className += " booked";
                        else if (isAvailable) className += " available";
                        if (isBooked && !isInstructor) className += " unclickable";

                        return (
                            <div className={`calendar-hour-row ${hour === currentHour && isToday(selectedDate) ? "current-hour" : ""}`} key={hour}>
                                <div className="calendar-time">{hour}:00</div>
                                <div
                                    className={className}
                                    style={{ position: "relative" }}
                                    onClick={() => {
                                        if (isBooked && isInstructor) {
                                            handleBookedSlotClick(booking);
                                            return;
                                        }
                                        if (isInstructor && !isBooked) {
                                            const containing = availability.find(a =>
                                                isWithinInterval(start, { start: a.start, end: a.end }) &&
                                                isWithinInterval(end, { start: a.start, end: a.end })
                                            );
                                            if (containing) {
                                                removeAvailabilityHour(start, end);
                                            } else {
                                                setAvailabilityStart(start);
                                                setShowAvailabilityModal(true);
                                            }
                                        } else if (!isInstructor && isAvailable) {
                                            const alreadyBooked = bookings.some(b => isSameDayDateFns(b.start, start));
                                            if (alreadyBooked) {
                                                alert("You can only book one lesson per day.");
                                                return;
                                            }
                                            setBookingStart(start);
                                            setShowBookingModal(true);
                                        }
                                    }}
                                >
                                    {isBooked
                                        ? isInstructor
                                            ? (booking.studentDisplayName || booking.studentEmail)
                                            : "Booked"
                                        : isAvailable
                                            ? isInstructor
                                                ? "Available"
                                                : ""
                                            : ""}
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
        const days = [];
        const pad = start.getDay();

        for (let i = 0; i < pad; i++) days.push(null);
        for (let d = start; d <= end; d = addDays(d, 1)) days.push(new Date(d));

        return (
            <div className="calendar-month-view">
                <div className="calendar-grid calendar-month-grid">
                    {days.map((day, index) => {
                        if (!day) return <div key={index} className="calendar-day empty"></div>;

                        const dayBookings = bookings.filter(b =>
                            isWithinInterval(day, { start: b.start, end: b.end })
                        );

                        return (
                            <div key={day} className={`calendar-day ${isSameDay(day, new Date()) ? "today" : ""}`}>
                                <div className="day-number">{format(day, "d")}</div>
                                <div className="day-events">
                                    {dayBookings.slice(0, 2).map((b, i) => (
                                        <div
                                            key={i}
                                            className="calendar-event booked"
                                            style={{ cursor: "pointer", position: "relative" }}
                                            onClick={() => isInstructor && handleBookedSlotClick(b)}
                                        >
                                            {format(b.start, "HH:mm")} - {format(b.end, "HH:mm")}
                                            {isInstructor && (
                                                <div style={{ fontSize: "11px", color: "#0077a6" }}>
                                                    {b.studentDisplayName || b.studentEmail}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {dayBookings.length > 2 && (
                                        <div className="more-events">+{dayBookings.length - 2} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="calendar-container">
            <div className="calendar-controls">
                <button className="today-button" onClick={() => setSelectedDate(new Date())}>Today</button>
                <button className="nav-arrow" onClick={handlePrevious}>&lt;</button>
                <span className="calendar-title">{getHeaderTitle()}</span>
                <button className="nav-arrow" onClick={handleNext}>&gt;</button>
                <div className="calendar-view-options">
                    {/* 
                    <button
                        className={`view-button${currentView === "day" ? " active" : ""}`}
                        onClick={() => setCurrentView("day")}
                    >Day</button>
                    */}
                    <button
                        className={`view-button${currentView === "week" ? " active" : ""}`}
                        onClick={() => setCurrentView("week")}
                    >Week</button>
                    {/*
                    <button
                        className={`view-button${currentView === "month" ? " active" : ""}`}
                        onClick={() => setCurrentView("month")}
                    >Month</button>
                    */}
                </div>

                {!isInstructor && (
                    <select
                        className="view-button"
                        style={{ minWidth: 90, marginLeft: 10, padding: "8px 12px" }}
                        value={bookingDuration}
                        onChange={(e) => setBookingDuration(Number(e.target.value))}
                    >
                        <option value={1}>1 Hour</option>
                        <option value={2}>2 Hours</option>
                    </select>
                )}
            </div>

            {showAvailabilityModal && renderAvailabilityModal()}
            {showBookingModal && renderBookingModal()}
            {showBookedModal && renderBookedLessonModal()}

            {currentView === "week" && renderWeekView()}
            {currentView === "day" && renderDayView()}
            {currentView === "month" && renderMonthView()}
        </div>
    );
}
