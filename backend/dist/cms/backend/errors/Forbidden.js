import { FORBIDDEN } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";
class Forbidden extends ExtendedError {
    constructor(msg = 'You do not have permission to access this resource') {
        super(msg);
        this.statusCode = FORBIDDEN;
    }
}
export default Forbidden;
