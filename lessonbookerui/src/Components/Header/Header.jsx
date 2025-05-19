// Header.jsx
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ variant = "login", displayName, onLogout }) => {
    const isDashboard = variant === "dashboard";

    return (
        <header className={`header ${isDashboard ? "dashboard-header" : ""}`}>
            <Link to="/">
                <img
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/b9e9e5de92c55fb604aec2676d045431b667b6fc690c90eccbe454d2f5e88fde?placeholderIfAbsent=true&apiKey=7a6d6551ec8b4e26865b758612878fc8"
                    alt="Company Logo"
                    className="logo"
                />
            </Link>

            {isDashboard && (
                <div className="userMenu">
                    <span className="userEmail">{displayName}</span>
                    <button onClick={onLogout} className="logoutButton">
                        Logout
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;