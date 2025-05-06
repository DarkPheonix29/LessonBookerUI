import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import ProfileSetup from './pages/ProfileSetup/ProfileSetup';
import Signup from './pages/Signup/Signup';
import StudentCalendar from './pages/StudentCalendar/StudentCalendar';
import InstructorDashboard from './pages/InstructorDashboard/InstructorDashboard';
import InstructorCalendar from './pages/InstructorCalendar/InstructorCalendar';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const App = () => {
    const [user, setUser] = useState(null);
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, [auth]);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/studentdashboard" element={user ? <StudentDashboard /> : <Login />} />
                <Route path="/studentcalendar" element={user ? <StudentCalendar /> : <Login />} />
                <Route path="/profilesetup/:email" element={user ? <ProfileSetup /> : <Login />} />
                <Route path="/instructordashboard" element={user ? <InstructorDashboard /> : <Login />} />
                <Route path="/instructorcalendar" element={user ? <InstructorCalendar /> : <Login />} />
                <Route path="/adminpanel" element={user ? <AdminPanel /> : <Login />} />
                <Route path="/signup" element={<Signup />} />
            </Routes>
        </Router>
    );
};

export default App;
