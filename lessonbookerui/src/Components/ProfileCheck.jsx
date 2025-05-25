import axios from "axios";
import API_BASE_URL from "./API/API";

export async function isProfileComplete(email) {
    try {
        const idToken = localStorage.getItem("idToken");
        const res = await axios.get(`${API_BASE_URL}/api/profile/${email}`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        const profile = res.data;

        // Adjust these fields as needed for your app
        const complete = !!(
            profile.displayName &&
            profile.phoneNumber &&
            profile.address &&
            profile.pickupAddress &&
            profile.dateOfBirth
        );
        return complete;
    } catch (err) {
        return false;
    }
}
