import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './Pages/Home/Home';
import Login from './Pages/Login/Login';
import StudentDashboard from './Pages/StudentDashboard/StudentDashboard';
import ProfileSetup from './Pages/ProfileSetup/ProfileSetup';
import Signup from './Pages/Signup/Signup';
import StudentCalendar from './Pages/StudentCalendar/StudentCalendar';
import InstructorDashboard from './Pages/InstructorDashboard/InstructorDashboard';
import InstructorCalendar from './Pages/InstructorCalendar/InstructorCalendar';
import AdminPanel from './Pages/AdminPanel/AdminPanel';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { isProfileComplete } from "../src/Components/ProfileCheck";
import { fetchUserRole } from "../src/Components/API/account";

const ProtectedRoute = ({ user, role, allowedRoles, children }) => {
    if (!user) return <Login />;
    if (!allowedRoles.includes(role)) return <div style={{ padding: 40, textAlign: "center" }}>Access Denied</div>;
    return children;
};

const AppRoutes = ({ user, role, loading, fetchAndSetRole, profileComplete, setProfileComplete }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.log("ROUTER EFFECT:");
        console.log("  user:", user);
        console.log("  role:", role);
        console.log("  profileComplete:", profileComplete);
        console.log("  loading:", loading);
        console.log("  location.pathname:", location.pathname);

        if (loading) {
            console.log("  Still loading, skipping navigation.");
            return;
        }
        const publicPaths = ["/", "/login", "/signup"];
        if (!user && !publicPaths.includes(location.pathname)) {
            console.log("  No user and not on public path, navigating to /");
            navigate("/", { replace: true });
        } else if (user) {
            // Student: profile incomplete
            if (
                role === "student" &&
                !profileComplete &&
                !location.pathname.startsWith("/profilesetup/")
            ) {
                console.log("  Student with incomplete profile, navigating to /profilesetup/:email");
                navigate(`/profilesetup/${user.email}`, { replace: true });
            }
            // Student: profile complete
            else if (
                role === "student" &&
                profileComplete &&
                !(
                    location.pathname === "/studentdashboard" ||
                    location.pathname === "/studentcalendar" ||
                    location.pathname.startsWith("/profilesetup/")
                )
            ) {
                console.log("  Student with complete profile, navigating to /studentdashboard");
                navigate("/studentdashboard", { replace: true });
            }
            // Instructor
            else if (
                role === "instructor" &&
                !["/instructordashboard", "/instructorcalendar"].includes(location.pathname)
            ) {
                console.log("  Instructor, navigating to /instructordashboard");
                navigate("/instructordashboard", { replace: true });
            }
            // Admin
            else if (
                role === "admin" &&
                location.pathname !== "/adminpanel"
            ) {
                console.log("  Admin, navigating to /adminpanel");
                navigate("/adminpanel", { replace: true });
            } else {
                console.log("  No navigation needed.");
            }
        }
    }, [user, role, profileComplete, loading, navigate, location.pathname]);

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login fetchAndSetRole={fetchAndSetRole} />} />
            <Route path="/signup" element={<Signup fetchAndSetRole={fetchAndSetRole} />} />
            <Route
                path="/profilesetup/:email"
                element={user ? <ProfileSetup onProfileComplete={() => setProfileComplete(true)} /> : <Login />}
            />
            <Route
                path="/studentdashboard"
                element={
                    <ProtectedRoute user={user} role={role} allowedRoles={["student"]}>
                        <StudentDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/studentcalendar"
                element={
                    <ProtectedRoute user={user} role={role} allowedRoles={["student"]}>
                        <StudentCalendar />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/instructordashboard"
                element={
                    <ProtectedRoute user={user} role={role} allowedRoles={["instructor"]}>
                        <InstructorDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/instructorcalendar"
                element={
                    <ProtectedRoute user={user} role={role} allowedRoles={["instructor"]}>
                        <InstructorCalendar />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/adminpanel"
                element={
                    <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [profileComplete, setProfileComplete] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();

    // This function can be called from Login.jsx after login
    const fetchAndSetRole = async (email) => {
        try {
            const role = await fetchUserRole();
            setRole(role);
            if (email) {
                const complete = await isProfileComplete(email);
                setProfileComplete(complete);
                console.log("FETCHANDSETROLE: email:", email, "role:", role, "profileComplete:", complete);
            }
        } catch (err) {
            console.log("FETCHANDSETROLE ERROR:", err);
            setRole(null);
            setProfileComplete(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("AUTH STATE CHANGED: user:", user);
            setUser(user);
            if (user) {
                const role = await fetchUserRole();
                setRole(role);
                const complete = await isProfileComplete(user.email);
                setProfileComplete(complete);
                console.log("AUTH STATE: email:", user.email, "role:", role, "profileComplete:", complete);
            } else {
                setRole(null);
                setProfileComplete(false);
                console.log("AUTH STATE: No user, reset role and profileComplete.");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <AppRoutes
                user={user}
                role={role}
                loading={loading}
                fetchAndSetRole={fetchAndSetRole}
                profileComplete={profileComplete}
                setProfileComplete={setProfileComplete}
            />
        </Router>
    );
};

export default App;
