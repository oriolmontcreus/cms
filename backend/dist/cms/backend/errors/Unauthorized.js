import { UNAUTHORIZED } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";
class Unauthorized extends ExtendedError {
    constructor(msg = 'The request was made without a valid session') {
        super(msg);
        this.statusCode = UNAUTHORIZED;
    }
}
export default Unauthorized;
