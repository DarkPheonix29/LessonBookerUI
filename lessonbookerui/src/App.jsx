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
import axios from 'axios';
import API_BASE_URL from "../src/Components/API/API";

// ProtectedRoute component
const ProtectedRoute = ({ user, role, allowedRoles, children }) => {
    if (!user) return <Login />;
    if (!allowedRoles.includes(role)) return <div style={{ padding: 40, textAlign: "center" }}>Access Denied</div>;
    return children;
};

const AppRoutes = ({ user, role, loading }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return;

        // Only redirect if on root or login/signup page
        const publicPaths = ["/", "/login", "/signup"];
        if (!user && !publicPaths.includes(location.pathname)) {
            navigate("/", { replace: true });
        } else if (user) {
            if (role === "student" && !["/studentdashboard", "/studentcalendar", "/profilesetup/:email"].includes(location.pathname)) {
                navigate("/studentdashboard", { replace: true });
            } else if (role === "instructor" && !["/instructordashboard", "/instructorcalendar"].includes(location.pathname)) {
                navigate("/instructordashboard", { replace: true });
            } else if (role === "admin" && location.pathname !== "/adminpanel") {
                navigate("/adminpanel", { replace: true });
            }
        }
    }, [user, role, loading, navigate, location.pathname]);

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
                path="/profilesetup/:email"
                element={user ? <ProfileSetup /> : <Login />}
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
    const [loading, setLoading] = useState(true);
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/account/me`, { withCredentials: true });
                    setRole(res.data.role);
                } catch (err) {
                    setRole(null);
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <AppRoutes user={user} role={role} loading={loading} />
        </Router>
    );
};

export default App;
