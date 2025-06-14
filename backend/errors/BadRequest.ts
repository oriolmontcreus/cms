import { BAD_REQUEST } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

class BadRequest extends ExtendedError {
    public override statusCode = BAD_REQUEST;
    constructor(msg = 'The request was made with invalid parameters') {
        super(msg);
    }
}
export default BadRequest;