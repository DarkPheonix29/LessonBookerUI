import axios from "axios";
import API_BASE_URL from "./API";

export async function fetchUserRole() {
    const res = await axios.get(`${API_BASE_URL}/api/account/me`, { withCredentials: true });
    return res.data.role;
}
