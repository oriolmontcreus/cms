import { NOT_FOUND } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

class NotFound extends ExtendedError {
    public override statusCode = NOT_FOUND;
    constructor(msg = 'Resource not found') {
        super(msg);
    }
}
export default NotFound;