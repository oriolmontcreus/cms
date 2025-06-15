type ErrorMessages = { [key: number]: string };

const errorMessages: ErrorMessages = {
    400: "[400] - Bad Request: The server could not understand the request.",
    401: "[401] - Unauthorized: Authentication is required or failed.",
    403: "[403] - Forbidden: You do not have permission to access this resource.",
    404: "[404] - Not Found: The requested resource could not be found."
};

export function logErr(err: any): void {
    const statusCode = err.status;
    const predefinedMsg = errorMessages[statusCode];
    const serverMsg = err.response?.data?.message || err.message || "An unknown error occurred";
    const msg = predefinedMsg || `Error: ${serverMsg}`;

    console.error(`${statusCode || ""}: ${msg}`);
}
