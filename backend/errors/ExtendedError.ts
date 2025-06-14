import { INTERNAL_SERVER_ERROR } from "@/constants/http.js";

class ExtendedError extends Error {
    public readonly isHandled = true;
    public statusCode = INTERNAL_SERVER_ERROR;
    constructor(msg: string) {
        super(msg);
    }
}
export default ExtendedError;