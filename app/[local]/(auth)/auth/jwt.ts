import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!;

export function signJwtAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, SECRET_KEY) as JwtPayload;
    } catch (error) {
        console.error(error);
        return null;
    }
}
