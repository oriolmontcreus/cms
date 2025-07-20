// ENVIRONMENT
export var Environment;
(function (Environment) {
    Environment["DEVELOPMENT"] = "development";
    Environment["PRODUCTION"] = "production";
})(Environment || (Environment = {}));
export const ENV = process.env.NODE_ENV || Environment.DEVELOPMENT;
export const USER_DATA_CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
//PERMANENT SECRET
const JWT_PERMANENT_SECRET = process.env.JWT_PERMANENT_SECRET ??
    "2c71190ec1a267p4335468c4c55499ad27a0b1a33c99d3c0a551e8b7388af94f08888371c56e8aa2e71ebb813da31bd1288245a15f77366ebf3c03a6a8e8fac2d123ed291e52ba89dce65a2145fe7b48ed61967c5bad550b29081fcfb1a3507d";
export const JTW_SECRET_KEY = new TextEncoder().encode(JWT_PERMANENT_SECRET);
export const TOKEN_EXPIRATION_TIME = "24h";
export const SESSION_COOKIE = "froggy-session";
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/froggy";
