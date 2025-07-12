import axios from "axios";

const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
};

function getBaseUrl() {
    return "http://localhost:3001/api";
}

const createApiInstance = () => {
    const instance = axios.create({
        baseURL: getBaseUrl(),
        withCredentials: true,
        headers: defaultHeaders,
        timeout: 10000,
    });
    return instance;
};

export const api = createApiInstance();
