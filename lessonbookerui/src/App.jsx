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
import { fetchUserRole, isProfileComplete } from "./Components/API/account";

const ProtectedRoute = ({ user, role, allowedRoles, children }) => {
    if (!user) return <Login />;
    if (!allowedRoles.includes(role)) return <div style={{ padding: 40, textAlign: "center" }}>Access Denied</div>;
    return children;
};

const AppRoutes = ({ user, role, loading, fetchAndSetRole, profileComplete }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return;
        const publicPaths = ["/", "/login", "/signup"];
        if (!user && !publicPaths.includes(location.pathname)) {
            navigate("/", { replace: true });
        } else if (user) {
            if (
                !profileComplete &&
                !location.pathname.startsWith("/profilesetup/")
            ) {
                navigate(`/profilesetup/${user.email}`, { replace: true });
            } else if (
                role === "student" &&
                !(
                    location.pathname === "/studentdashboard" ||
                    location.pathname === "/studentcalendar" ||
                    location.pathname.startsWith("/profilesetup/")
                )
            ) {
                navigate("/studentdashboard", { replace: true });
            } else if (
                role === "instructor" &&
                !["/instructordashboard", "/instructorcalendar"].includes(location.pathname)
            ) {
                navigate("/instructordashboard", { replace: true });
            } else if (
                role === "admin" &&
                location.pathname !== "/adminpanel"
            ) {
                navigate("/adminpanel", { replace: true });
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
            }
        } catch {
            setRole(null);
            setProfileComplete(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                await fetchAndSetRole(user.email);
            } else {
                setRole(null);
                setProfileComplete(false);
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
            />
        </Router>
    );
};

export default App;
