import { NOT_FOUND } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";
class NotFound extends ExtendedError {
    constructor(msg = 'Resource not found') {
        super(msg);
        this.statusCode = NOT_FOUND;
    }
}
export default NotFound;
