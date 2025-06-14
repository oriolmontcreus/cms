import { INVALID_TOKEN } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

class InvalidToken extends ExtendedError {
    public override statusCode = INVALID_TOKEN;
    constructor(msg = 'Invalid or expired token') {
        super(msg);
    }
}
export default InvalidToken;