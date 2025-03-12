import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
    const auth = getAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Welcome to Student Dashboard</h1>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">Logout</button>
        </div>
    );
};

export default StudentDashboard;
