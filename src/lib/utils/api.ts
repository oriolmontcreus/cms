import axios from "axios";


const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
};

function getBaseUrl() {
    return "http://localhost:3001/api";
}

// Configure the API instance with proper credentials
const createApiInstance = () => {
    const instance = axios.create({
        baseURL: getBaseUrl(),
        withCredentials: true,
        headers: defaultHeaders,
        timeout: 15000, // 15 second timeout
    });

    return instance;
};

export const api = createApiInstance();
