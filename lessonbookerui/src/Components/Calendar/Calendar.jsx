import React, { useState, useEffect } from "react";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
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
    isSameDay as isSameDayDateFns,
} from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Calendar.css";
import API_BASE_URL from "../../Components/API/API";

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i * 30); // 0, 30, 60, ..., 1410

// Helper to get the Authorization header
const getAuthHeader = () => {
    const idToken = localStorage.getItem("idToken");
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
};

// Add this helper at the top (or reuse if already present)
const dangerousKeys = ["__proto__", "constructor", "prototype"];

export default function DrivingSchoolCalendar({
    isInstructor = true,
    isAdmin = false, // <-- add this
    viewMode = "full",
    instructorEmail,
    studentEmail
}) {
    const [currentView, setCurrentView] = useState("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [repeatUntil, setRepeatUntil] = useState(null);
    const [studentProfiles, setStudentProfiles] = useState({});
    const [instructors, setInstructors] = useState([]);
    const [selectedInstructor, setSelectedInstructor] = useState("all");

    // Modal state for instructor availability
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [availabilityStart, setAvailabilityStart] = useState(null);
    const [availabilityEnd, setAvailabilityEnd] = useState(null);

    // Modal state for student booking
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingStart, setBookingStart] = useState(null);

    // Modal state for booked lesson details
    const [showBookedModal, setShowBookedModal] = useState(false);
    const [bookedLessonDetails, setBookedLessonDetails] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState(null);

    const currentHour = new Date().getHours();

    // --- SignalR connection and calendar data fetching ---
    useEffect(() => {
        let connection;

        // Function to fetch calendar data
        const fetchCalendarData = () => {
            if (isInstructor && !isAdmin) {
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
                        const uniqueInstructors = Array.from(
                            new Set(parsed.map(a => a.instructorEmail))
                        );
                        setInstructors(uniqueInstructors);
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
        };

        fetchCalendarData(); // Initial fetch

        // Setup SignalR connection
        connection = new signalR.HubConnectionBuilder()
            .withUrl(
                import.meta.env.PROD
                    ? `${API_BASE_URL}/calendarHub`
                    : "/calendarHub"
            )
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                connection.on("CalendarUpdated", () => {
                    fetchCalendarData();
                });
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        // Cleanup on unmount
        return () => {
            if (connection) {
                connection.stop();
            }
        };
    // Only re-run if instructorEmail, studentEmail, isInstructor, or selectedInstructor changes
    }, [instructorEmail, studentEmail, isInstructor, selectedInstructor]);

    useEffect(() => {
        // Find all unique student emails in bookings
        const emails = Array.from(new Set(bookings.map(b => b.studentEmail)));
        // Filter out emails we already have
        const missing = emails.filter(email => !Object.prototype.hasOwnProperty.call(studentProfiles, email));
        if (missing.length === 0) return;

        // Fetch all missing profiles in parallel
        Promise.all(
            missing.map(email =>
                axios.get(`${API_BASE_URL}/api/profile/${email}`, { headers: getAuthHeader() })
                    .then(res => ({ email, displayName: res.data.displayName || "" }))
                    .catch(() => ({ email, displayName: "" }))
            )
        ).then(results => {
            setStudentProfiles(prev => {
                const updated = { ...prev };
                results.forEach(({ email, displayName }) => {
                    if (!dangerousKeys.includes(email)) {
                        updated[email] = displayName;
                    }
                });
                return updated;
            });
        });
    }, [bookings]);

    const addNewAvailability = (start, end) => {
        // If repeatUntil is not set or before start, just add one slot
        if (!repeatUntil || repeatUntil <= start) {
            postAvailabilitySlot(start, end);
            return;
        }

        // Repeat only on the same weekday as 'start'
        let current = new Date(start);
        let currentEnd = new Date(end);
        const targetDay = current.getDay(); // 0=Sunday, 1=Monday, etc.

        while (current <= repeatUntil) {
            if (current.getDay() === targetDay) {
                postAvailabilitySlot(new Date(current), new Date(currentEnd));
            }
            // Move to next day
            current.setDate(current.getDate() + 1);
            currentEnd.setDate(currentEnd.getDate() + 1);
        }
    };

    // Helper to post a single slot
    const postAvailabilitySlot = (start, end) => {
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
        if (![1, 1.5].includes(durationHours)) {
            alert("You can only book a lesson for 1 or 1.5 hours.");
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
            const email = booking.studentEmail;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error("Invalid email address.");
            }
            const res = await axios.get(`${API_BASE_URL}/api/profile/${encodeURIComponent(email)}`, {
                headers: getAuthHeader(),
            });
            setBookedLessonDetails({
                ...booking,
                phoneNumber: res.data.phoneNumber || "",
                displayName: res.data.displayName || booking.studentDisplayName || booking.studentEmail,
                address: res.data.address || res.data.pickupAddress || "" // Add this line
            });
        } catch (err) {
            setProfileError("Could not load student profile.");
            setBookedLessonDetails({
                ...booking,
                phoneNumber: "",
                displayName: booking.studentDisplayName || booking.studentEmail,
                address: ""
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
                        {bookedLessonDetails.phoneNumber && (
                            <p><b>Phone Number:</b> {bookedLessonDetails.phoneNumber}</p>
                        )}
                        {bookedLessonDetails.address && (
                            <p><b>Pickup Address:</b> {bookedLessonDetails.address}</p>
                        )}
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
                        value={availabilityEnd ? `${availabilityEnd.getHours().toString().padStart(2, "0")}:${availabilityEnd.getMinutes() === 0 ? "00" : "30"}` : ""}
                        onChange={e => {
                            if (!availabilityStart) return;
                            const [h, m] = e.target.value.split(":");
                            const end = new Date(availabilityStart);
                            end.setHours(Number(h), Number(m), 0, 0);
                            setAvailabilityEnd(end);
                        }}
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
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <label style={{ color: "#111", marginRight: 8, marginBottom: 0, whiteSpace: "nowrap" }}>
                        Repeat daily until:
                    </label>
                    <DatePicker
                        selected={repeatUntil}
                        onChange={date => setRepeatUntil(date)}
                        minDate={availabilityStart}
                        placeholderText="No repeat"
                        dateFormat="yyyy-MM-dd"
                        isClearable
                        popperPlacement="bottom"
                        wrapperClassName="repeat-datepicker-wrapper"
                    />
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
                    <button
                        className="view-button"
                        style={{ color: "#00cfff" }}
                        onClick={() => {
                            setShowAvailabilityModal(false);
                            setAvailabilityStart(null);
                            setAvailabilityEnd(null);
                            setRepeatUntil(null);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="view-button"
                        style={{ color: "#0077a6" }}
                        disabled={!availabilityStart || !availabilityEnd || availabilityEnd <= availabilityStart}
                        onClick={() => {
                            if (availabilityStart && availabilityEnd && availabilityEnd > availabilityStart) {
                                addNewAvailability(availabilityStart, availabilityEnd);
                                setShowAvailabilityModal(false);
                                setAvailabilityStart(null);
                                setAvailabilityEnd(null);
                                setRepeatUntil(null);
                            }
                        }}
                    >
                        Save
                    </button>
                </div>
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
                            addBooking(bookingStart, 1.5);
                            setShowBookingModal(false);
                            setBookingStart(null);
                        }}
                    >
                        1.5 Hours
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
        filteredBookings.find(b => areIntervalsOverlapping({ start, end }, { start: b.start, end: b.end }));

    const handleRemoveAllAvailabilityForDay = (day) => {
        const slotsToRemove = availability.filter(a => isSameDay(a.start, day));
        if (slotsToRemove.length === 0) return;
        if (!window.confirm("Are you sure you want to remove all availability for this day?")) return;
        Promise.all(
            slotsToRemove.map(a =>
                axios.delete(`${API_BASE_URL}/api/availability/${parseInt(a.availabilityId || a.id, 10)}`, {
                    headers: getAuthHeader(),
                })
            )
        ).then(() => {
            setAvailability(prev => prev.filter(a => !isSameDay(a.start, day)));
        }).catch(() => {
            alert("Failed to remove all availability for this day.");
        });
    };

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
                            onClick={() => {
                                if (isInstructor || isAdmin) handleRemoveAllAvailabilityForDay(day);
                            }}
                            style={isInstructor || isAdmin ? { cursor: "pointer" } : {}}
                        >
                            {format(day, "EEE dd")}
                        </div>
                    ))}
                </div>

                {HALF_HOURS.map((minuteOfDay) => {
                    const hour = Math.floor(minuteOfDay / 60);
                    const minute = minuteOfDay % 60;
                    const isHourRow = minute === 0;
                    return (
                        <div
                            className={`calendar-hour-row${isHourRow ? " hour-separator" : " halfhour-separator"}`}
                            key={minuteOfDay}
                        >
                            <div
                                className={`calendar-time${hour === currentHour && minute === 0 && isToday(selectedDate) ? " current-hour" : ""}`}
                            >
                                {hour}:{minute === 0 ? "00" : "30"}
                            </div>
                            {days.map((day) => {
                                const slotStart = new Date(day);
                                slotStart.setHours(hour, minute, 0, 0);
                                const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
                                const booking = getBookingForSlot(slotStart, slotEnd);
                                const isBooked = !!booking;
                                const isBookedByOther = isBooked && !isInstructor && booking.studentEmail !== studentEmail;
                                let isAvailable = false;
                                if (!isBooked) {
                                    isAvailable = filteredAvailability.some(
                                        a =>
                                            isWithinInterval(slotStart, { start: a.start, end: a.end }) &&
                                            isWithinInterval(slotEnd, { start: a.start, end: a.end })
                                    );
                                }
                                let className = "calendar-slot";
                                if (isBooked) className += " booked";
                                else if (isAvailable) className += " available";
                                if (isBookedByOther) className += " unclickable other-booked";
                                else if (isBooked && !isInstructor) className += " unclickable";

                                return (
                                    <div
                                        key={`${day}-${hour}-${minute}`}
                                        className={className}
                                        style={{ position: "relative" }}
                                        onClick={() => {
                                            if (isBookedByOther) return;
                                            if (isBooked && isInstructor) {
                                                handleBookedSlotClick(booking);
                                                return;
                                            }
                                            if ((isInstructor || isAdmin) && !isBooked) {
                                                const containing = availability.find(a =>
                                                    isWithinInterval(slotStart, { start: a.start, end: a.end }) &&
                                                    isWithinInterval(slotEnd, { start: a.start, end: a.end })
                                                );
                                                if (containing) {
                                                    removeAvailabilityHour(slotStart, slotEnd);
                                                } else {
                                                    setAvailabilityStart(slotStart);
                                                    setShowAvailabilityModal(true);
                                                }
                                            } else if (!isInstructor && isAvailable) {
                                                const alreadyBooked = bookings.some(
                                                    b => b.studentEmail === studentEmail && isSameDayDateFns(b.start, slotStart)
                                                );
                                                if (alreadyBooked) {
                                                    alert("You can only book one lesson per day.");
                                                    return;
                                                }
                                                setBookingStart(slotStart);
                                                setShowBookingModal(true);
                                            }
                                        }}
                                    >
                                        {isBookedByOther
                                            ? ""
                                            : isBooked
                                                ? (isInstructor || isAdmin)
                                                    ? (studentProfiles[booking.studentEmail] || booking.displayName || booking.studentDisplayName || booking.studentName || booking.studentEmail)
                                                    : "Booked"
                                                : isAvailable
                                                    ? (isInstructor || isAdmin)
                                                        ? "Available"
                                                        : ""
                                                    : ""}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
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
                    {HALF_HOURS.map((hour) => {
                        const start = setHours(startOfDay, hour);
                        const end = new Date(start.getTime() + 60 * 60 * 1000);
                        const booking = getBookingForSlot(start, end);
                        const isBooked = !!booking;
                        const isBookedByOther = isBooked && !isInstructor && booking.studentEmail !== studentEmail;
                        let isAvailable = false;
                        if (!isBooked) {
                            isAvailable = filteredAvailability.some(
                                a =>
                                    isWithinInterval(start, { start: a.start, end: a.end }) &&
                                    isWithinInterval(end, { start: a.start, end: a.end })
                            );
                        }

                        let className = "calendar-slot";
                        if (isBooked) className += " booked";
                        else if (isAvailable) className += " available";
                        if (isBookedByOther) className += " unclickable other-booked";
                        else if (isBooked && !isInstructor) className += " unclickable";
                        // No current-hour class on slots!

                        return (
                            <div className="calendar-hour-row" key={hour}>
                                {/* Only the hour label gets the current-hour class */}
                                <div
                                    className={`calendar-time${hour === currentHour && isToday(selectedDate) ? " current-hour" : ""}`}
                                >
                                    {hour}:00
                                </div>
                                <div
                                    className={className}
                                    style={{ position: "relative" }}
                                    onClick={() => {
                                        if (isBookedByOther) return; // Non-pressable
                                        if (isBooked && isInstructor) {
                                            handleBookedSlotClick(booking);
                                            return;
                                        }
                                        if ((isInstructor || isAdmin) && !isBooked) {
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
                                            const alreadyBooked = bookings.some(
                                                b => b.studentEmail === studentEmail && isSameDayDateFns(b.start, start)
                                            );
                                            if (alreadyBooked) {
                                                alert("You can only book one lesson per day.");
                                                return;
                                            }
                                            setBookingStart(start);
                                            setShowBookingModal(true);
                                        }
                                    }}
                                >
                                    {isBookedByOther
                                        ? "" // No text for slots booked by others
                                        : isBooked
                                            ? isInstructor
                                                ? (studentProfiles[booking.studentEmail] || booking.displayName || booking.studentDisplayName || booking.studentName || booking.studentEmail)
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
                                                    {b.displayName || b.studentDisplayName || b.studentName || b.studentEmail}
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

    // Before rendering, filter availability and bookings if needed
    const filteredAvailability = selectedInstructor === "all"
        ? availability
        : availability.filter(a => a.instructorEmail === selectedInstructor);

    const filteredBookings = selectedInstructor === "all"
        ? bookings
        : bookings.filter(b => b.instructorEmail === selectedInstructor);

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
            </div>

            {(!isInstructor || isAdmin) && instructors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <label>
                        <b>Filter by Instructor: </b>
                        <select
                            value={selectedInstructor}
                            onChange={e => setSelectedInstructor(e.target.value)}
                            style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: "1px solid #6ce5ff" }}
                        >
                            <option value="all">All Instructors</option>
                            {instructors.map(email => (
                                <option key={email} value={email}>{email}</option>
                            ))}
                        </select>
                    </label>
                </div>
            )}

            {showAvailabilityModal && renderAvailabilityModal()}
            {showBookingModal && renderBookingModal()}
            {showBookedModal && renderBookedLessonModal()}

            {currentView === "week" && renderWeekView()}
            {currentView === "day" && renderDayView()}
            {currentView === "month" && renderMonthView()}
        </div>
    );
}
