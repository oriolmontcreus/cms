import * as jose from "jose";
import { JTW_SECRET_KEY, TOKEN_EXPIRATION_TIME } from "@/constants/env.js";
import Unauthorized from "@/errors/Unauthorized.js";
import InvalidToken from "@/errors/InvalidToken.js";
export async function createToken(payload) {
    try {
        return await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(TOKEN_EXPIRATION_TIME)
            .sign(JTW_SECRET_KEY);
    }
    catch (err) {
        throw new Unauthorized(`Token creation error: ${err}`);
    }
}
export async function verifyToken(token) {
    try {
        const { payload } = await jose.jwtVerify(token, JTW_SECRET_KEY);
        return payload;
    }
    catch (err) {
        throw new InvalidToken(`Failed to verify token: ${err}`);
    }
}
