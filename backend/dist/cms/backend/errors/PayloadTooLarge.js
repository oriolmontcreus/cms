import { PAYLOAD_TOO_LARGE } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";
class PayloadTooLarge extends ExtendedError {
    constructor(msg = 'File size exceeds the limit') {
        super(msg);
        this.statusCode = PAYLOAD_TOO_LARGE;
    }
}
export default PayloadTooLarge;
