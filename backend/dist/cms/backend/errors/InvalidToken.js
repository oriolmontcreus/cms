import { INVALID_TOKEN } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";
class InvalidToken extends ExtendedError {
    constructor(msg = 'Invalid or expired token') {
        super(msg);
        this.statusCode = INVALID_TOKEN;
    }
}
export default InvalidToken;
