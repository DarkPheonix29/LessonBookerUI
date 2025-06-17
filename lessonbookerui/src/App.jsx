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

// Add this helper function above AppRoutes
function handleNavigation({ user, role, profileComplete, loading, location, navigate }) {
    if (loading) return;

    const publicPaths = ["/", "/login", "/signup"];
    const path = location.pathname;

    // Not logged in: only allow public paths
    if (!user) {
        if (!publicPaths.includes(path)) {
            navigate("/", { replace: true });
        }
        return;
    }

    // Student logic
    if (role === "student") {
        if (!profileComplete && !path.startsWith("/profilesetup/")) {
            navigate(`/profilesetup/${user.email}`, { replace: true });
            return;
        }
        if (profileComplete && !["/studentdashboard", "/studentcalendar"].includes(path)) {
            navigate("/studentdashboard", { replace: true });
            return;
        }
        return;
    }

    // Instructor logic
    if (role === "instructor") {
        if (!["/instructordashboard", "/instructorcalendar"].includes(path)) {
            navigate("/instructordashboard", { replace: true });
        }
        return;
    }

    // Admin logic
    if (role === "admin" && path !== "/adminpanel") {
        navigate("/adminpanel", { replace: true });
    }
}

const AppRoutes = ({ user, role, loading, profileComplete, setProfileComplete }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        handleNavigation({ user, role, profileComplete, loading, location, navigate });
    }, [user, role, profileComplete, loading, navigate, location.pathname]);

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // Always refresh and set the ID token in localStorage
                const idToken = await user.getIdToken(true);
                localStorage.setItem("idToken", idToken);

                const role = await fetchUserRole();
                setRole(role);
                const complete = await isProfileComplete(user.email);
                setProfileComplete(complete);
            } else {
                setRole(null);
                setProfileComplete(false);
                localStorage.removeItem("idToken");
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
                profileComplete={profileComplete}
                setProfileComplete={setProfileComplete}
            />
        </Router>
    );
};

export default App;
