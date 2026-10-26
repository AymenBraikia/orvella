import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

// Fail loudly at startup instead of signing/verifying with "undefined" and silently logging everyone out.
if (!SECRET_KEY) throw new Error("JWT_SECRET is not set. Add a long random string to your environment (.env locally, Vercel → Settings → Environment Variables).");

export function signJwtAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET_KEY!, { expiresIn: "7d" });
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, SECRET_KEY!) as JwtPayload;
    } catch (error) {
        // Expired or tampered tokens are normal (the visitor is simply treated as logged out).
        if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
            if (process.env.NODE_ENV !== "production") console.debug(`JWT rejected: ${error.message}`);
        } else {
            console.error("JWT verification failed unexpectedly", error);
        }
        return null;
    }
}
