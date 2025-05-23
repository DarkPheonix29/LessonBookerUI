import axios from "axios";
import API_BASE_URL from "./Components/API/API";

export async function isProfileComplete(email) {
    try {
        const idToken = localStorage.getItem("idToken");
        const res = await axios.get(`${API_BASE_URL}/api/profile/${email}`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        // Adjust this logic based on your profile fields
        const profile = res.data;
        return !!(profile.displayName && profile.phoneNumber && profile.address && profile.dateOfBirth);
    } catch {
        return false;
    }
}
