import "dotenv/config";
import { attachDatabasePool } from "@vercel/functions";
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGO_URI || "";
if (!uri) throw new Error("Please add your Mongo URI to .env");

const options = {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: false },
};

const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    attachDatabasePool(client);
    globalWithMongo._mongoClientPromise = client.connect();
}

const clientPromise = globalWithMongo._mongoClientPromise;
export default clientPromise;
