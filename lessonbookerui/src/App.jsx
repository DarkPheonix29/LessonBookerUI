import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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
            </Routes>
        </Router>
    );
};

export default App;
