import clientPromise from "@/app/db/client";

import type { Watch } from "@/app/types/watch";
import type { Spare } from "@/app/types/spare";
import type { User } from "@/app/types/user";
import type { Order } from "@/types/order";
import type { Consignment } from "@/types/consignment";
import type { Sell } from "@/types/sell";
import type { Appointment } from "@/types/appointment";
import { Visitor } from "@/types/visitor";

export async function db() {
    console.clear();
    console.log("Connecting to db...");
    const client = await clientPromise;
    return client.db("timedriven");
}

export const watches_collection = async () => (await db()).collection<Watch>("watches");
export const spares_collection = async () => (await db()).collection<Spare>("spares");
export const users_collection = async () => (await db()).collection<User>("users");
export const orders_collection = async () => (await db()).collection<Order>("orders");
export const sell_collection = async () => (await db()).collection<Sell>("sell");
export const consignments_collection = async () => (await db()).collection<Consignment>("consignment");
export const appointments_collection = async () => (await db()).collection<Appointment>("appointment");
export const visitors_collection = async () => (await db()).collection<Visitor>("visitors");

export {};
