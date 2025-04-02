import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../Components/Header/Header';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    return (
        <div className="homeContainer">
            <Header />
            <div className="homeContent">
                <h2>
                    Welcome to Driving School Pascal van Dooren
                    <span className="lessonBookerText">LessonBooker</span>
                </h2>
                <p>
                    Our platform makes it easier for students to book driving lessons with experienced instructors.
                    Instructors can set their availability, and students can book lessons based on their available slots.
                </p>
                <p>
                    Whether you are a student or an instructor, we are here to help you connect and learn at your convenience.
                </p>
                <button onClick={handleLoginRedirect} className="homeLoginButton">
                    Login
                </button>
            </div>
        </div>
    );
};

export default Home;
