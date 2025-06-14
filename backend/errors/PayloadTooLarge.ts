import { PAYLOAD_TOO_LARGE } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

class PayloadTooLarge extends ExtendedError {
    public override statusCode = PAYLOAD_TOO_LARGE;
    constructor(msg = 'File size exceeds the limit') {
        super(msg);
    }
}
export default PayloadTooLarge;