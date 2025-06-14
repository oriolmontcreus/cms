import { UNAUTHORIZED } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

class Unauthorized extends ExtendedError {
    public override statusCode = UNAUTHORIZED;
    constructor(msg = 'The request was made without a valid session') {
        super(msg);
    }
}
export default Unauthorized;