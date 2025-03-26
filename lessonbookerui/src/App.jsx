import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import ProfileSetup from "./pages/ProfileSetup/ProfileSetup";
import Signup from "./pages/Signup/Signup";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ProfileSetup from "./Pages/ProfileSetup/ProfileSetup";
import Signup from "./Pages/Signup/Signup";

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
                <Route path="/" element={<Login />} />
                <Route path="/studentdashboard" element={user ? <StudentDashboard /> : <Login />} />
                <Route path="/profile-setup/:email" element={<ProfileSetup />} />
                <Route path="/signup" element={<Signup />}
            </Routes>
        </Router>
    );
};

export default App;
