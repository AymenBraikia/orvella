/**
 * Promote a user to admin.
 *
 *   node scripts/make_admin.mjs you@example.com
 *
 * Sign up through the normal form first, then run this.
 */
import "dotenv/config";
import { MongoClient } from "mongodb";

const email = process.argv[2];
if (!email) {
    console.error("Usage: node scripts/make_admin.mjs <email>");
    process.exit(1);
}

const client = new MongoClient(process.env.MONGO_URI);

try {
    await client.connect();
    const result = await client.db("timedriven").collection("users").updateOne({ email }, { $set: { admin: true } });

    if (result.matchedCount === 0) console.error(`No user found with the email ${email}. Sign up first.`);
    else console.log(`${email} is now an admin. Log out and back in to refresh the token.`);
} finally {
    await client.close();
}
