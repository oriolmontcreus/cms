import { CONFLICT } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";
class AlreadyExists extends ExtendedError {
    constructor(msg = 'A resource with the same data already exists') {
        super(msg);
        this.statusCode = CONFLICT;
    }
}
export default AlreadyExists;
