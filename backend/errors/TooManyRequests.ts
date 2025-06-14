import { TOO_MANY_REQUESTS } from "@/constants/http.js";
import ExtendedError from "@/errors/ExtendedError.js";

/**
 * Error class for rate limit exceeded responses (HTTP 429)
 */
class TooManyRequests extends ExtendedError {
  public override statusCode = TOO_MANY_REQUESTS;
  constructor(msg = "Rate limit exceeded. Try again later.") {
    super(msg);
  }
}

export default TooManyRequests;
