import axios from "axios";
import API_BASE_URL from "./API";

export async function fetchUserRole() {
    const idToken = localStorage.getItem("idToken");
    if (!idToken) throw new Error("No ID token found");

    const res = await axios.get(`${API_BASE_URL}/api/account/me`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });
    return res.data.role;
}
