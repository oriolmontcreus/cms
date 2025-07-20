import { INTERNAL_SERVER_ERROR } from "@/constants/http.js";
class ExtendedError extends Error {
    constructor(msg) {
        super(msg);
        this.isHandled = true;
        this.statusCode = INTERNAL_SERVER_ERROR;
    }
}
export default ExtendedError;
