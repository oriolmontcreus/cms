import { FORBIDDEN } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

class Forbidden extends ExtendedError {
    public override statusCode = FORBIDDEN;
    constructor(msg = 'You do not have permission to access this resource') {
        super(msg);
    }
}
export default Forbidden;