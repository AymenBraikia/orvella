/**
 * Create the MongoDB indexes the app relies on (safe to run again).
 *
 *   npm run ensure-indexes
 *
 * Unique indexes protect against duplicate order numbers, slugs and accounts; the rest keep the
 * admin lists and reservation cleanup fast as data grows.
 */
import "dotenv/config";
import { MongoClient, type IndexDescription } from "mongodb";

const DB_NAME = "orvella";

const INDEXES: Record<string, IndexDescription[]> = {
    items: [{ key: { slug: 1 }, unique: true }, { key: { type: 1, date_added: -1 } }, { key: { "reservations.until": 1 } }],
    orders: [{ key: { id: 1 }, unique: true }, { key: { paypal_order_id: 1 }, unique: true, sparse: true }, { key: { email: 1, created_at: -1 } }, { key: { status: 1, created_at: -1 } }],
    users: [{ key: { email: 1 }, unique: true }],
    sell: [{ key: { id: 1 } }, { key: { created_at: -1 } }],
    consignment: [{ key: { id: 1 } }, { key: { created_at: -1 } }],
    appointment: [{ key: { id: 1 } }, { key: { date: 1 } }],
};

if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set (add it to .env).");
    process.exit(1);
}

const client = new MongoClient(process.env.MONGO_URI);

try {
    await client.connect();
    const db = client.db(DB_NAME);

    for (const [collection, indexes] of Object.entries(INDEXES)) {
        for (const index of indexes) {
            try {
                const name = await db.collection(collection).createIndex(index.key, { unique: index.unique, sparse: index.sparse });
                console.log(`✓ ${collection}.${name}`);
            } catch (error) {
                // Usually existing duplicates blocking a unique index — report and continue.
                console.error(`✗ ${collection} ${JSON.stringify(index.key)}: ${(error as Error).message}`);
                process.exitCode = 1;
            }
        }
    }
} finally {
    await client.close();
}
