import { getCookie } from "hono/cookie";
import Unauthorized from "@/errors/Unauthorized.js";
import { SESSION_COOKIE } from "@/constants/env.js";
import * as authService from "@/src/services/auth.service.js";
import { log } from "@/lib/log.js";
import { Roles } from "@shared/constants/role.type.js";
export function withAuth(handler, requiredRolesMask = Roles.DEVELOPER) {
    return async function (c, next) {
        const sessionCookie = getCookie(c, SESSION_COOKIE);
        if (!sessionCookie) {
            log("WARN", `Auth failed: Missing session cookie at ${c.req.path}`);
            throw new Unauthorized("Missing authentication token. Please log in.");
        }
        try {
            const user = await authService.getCurrentUser(sessionCookie);
            if ((user.permissions & requiredRolesMask) !== requiredRolesMask) {
                log("WARN", `Auth failed: Insufficient permissions for user ${user._id} at ${c.req.path}`);
                throw new Unauthorized();
            }
            c.set("user", user);
            return await handler(c, next);
        }
        catch (err) {
            if (err instanceof Unauthorized)
                throw err;
            log("ERROR", `Authentication failed at ${c.req.path}: ${err}`);
            throw new Unauthorized();
        }
    };
}
