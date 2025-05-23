import axios from "axios";
import API_BASE_URL from "./API";

export async function isProfileComplete(email) {
    try {
        const idToken = localStorage.getItem("idToken");
        const res = await axios.get(`${API_BASE_URL}/api/profile/${email}`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        const profile = res.data;
        // Log for debugging
        console.log("Profile data for", email, ":", profile);

        // Adjust these fields as needed for your app
        const complete = !!(
            profile.displayName &&
            profile.phoneNumber &&
            profile.address &&
            profile.pickupAddress &&
            profile.dateOfBirth
        );
        console.log("Profile complete?", complete);
        return complete;
    } catch (err) {
        console.log("Profile check error:", err);
        return false;
    }
}
