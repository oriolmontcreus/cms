import { CONFLICT } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

class AlreadyExists extends ExtendedError {
    public override statusCode = CONFLICT;
    constructor(msg = 'A resource with the same data already exists') {
        super(msg);
    }
}
export default AlreadyExists;