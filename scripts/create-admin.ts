/**
 * Give an existing account admin rights (or take them away).
 *
 *   1. Sign up on the site with the email you want to use.
 *   2. Run, with MONGO_URI in .env (or in the environment):
 *
 *        npm run create-admin -- you@example.com
 *        npm run create-admin -- you@example.com --remove
 *
 *      (same as: node scripts/create-admin.ts you@example.com — needs Node 22.18+;
 *       on older Node use: npx tsx scripts/create-admin.ts you@example.com)
 *
 *   3. Log out and back in, then open /admin.
 *
 * Admin rights are checked against the database on every admin request, so --remove takes
 * effect immediately, even for someone who is still logged in.
 */
import "dotenv/config";
import { MongoClient } from "mongodb";

const DB_NAME = "orvella"; // same as app/db/collections.ts

const email = process.argv[2]?.trim();
const remove = process.argv.includes("--remove");

if (!email || email.startsWith("--")) {
    console.error("Usage: npm run create-admin -- <email> [--remove]");
    process.exit(1);
}
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set (add it to .env).");
    process.exit(1);
}

const client = new MongoClient(process.env.MONGO_URI);

try {
    await client.connect();
    const users = client.db(DB_NAME).collection("users");

    // Emails are stored as typed at sign-up; fall back to a case-insensitive match.
    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = (await users.findOne({ email })) ?? (await users.findOne({ email: { $regex: `^${escaped}$`, $options: "i" } }));

    if (!user) {
        console.error(`No account with the email ${email}. Sign up on the site first.`);
        process.exitCode = 1;
    } else {
        await users.updateOne({ _id: user._id }, remove ? { $unset: { admin: "" } } : { $set: { admin: true } });
        console.log(remove ? `${user.email} is no longer an admin.` : `${user.email} is now an admin. Log out and back in, then open /admin.`);
    }
} finally {
    await client.close();
}
