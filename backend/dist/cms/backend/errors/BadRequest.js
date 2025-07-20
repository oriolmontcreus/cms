import { BAD_REQUEST } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";
class BadRequest extends ExtendedError {
    constructor(msg = 'The request was made with invalid parameters') {
        super(msg);
        this.statusCode = BAD_REQUEST;
    }
}
export default BadRequest;
