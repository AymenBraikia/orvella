import clientPromise from "@/app/db/client";

import type { GuestCart, User } from "@/app/types/user";
import type { Order } from "@/types/order";
import type { Consignment } from "@/types/consignment";
import type { Sell } from "@/types/sell";
import type { Appointment } from "@/types/appointment";
import { Visitor } from "@/types/visitor";
import { MongoClient } from "mongodb";
import { Item } from "@/types/item";
import type { StoreSettings } from "@/types/settings";
import type { Enquiry } from "@/types/enquiry";

let client: MongoClient | null = null;

export async function db() {
    if (!client) {
        console.clear();
        console.log("Connecting to db...");
        client = await clientPromise;
        return client.db("orvella");
    } else return client.db("orvella");
}

export const items_collection = async () => (await db()).collection<Item>("items");
export const users_collection = async () => (await db()).collection<User>("users");
export const orders_collection = async () => (await db()).collection<Order>("orders");
export const sell_collection = async () => (await db()).collection<Sell>("sell");
export const consignments_collection = async () => (await db()).collection<Consignment>("consignment");
export const appointments_collection = async () => (await db()).collection<Appointment>("appointment");
export const visitors_collection = async () => (await db()).collection<Visitor>("visitors");
export const enquiries_collection = async () => (await db()).collection<Enquiry>("enquiries");
export const carts_collection = async () => (await db()).collection<GuestCart>("carts");
export const counters_collection = async () => (await db()).collection<{ _id: string; seq: number }>("counters");
export const settings_collection = async () => (await db()).collection<StoreSettings & { _id: string }>("settings");

export {};
