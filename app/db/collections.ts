import clientPromise from "@/app/db/client";

import type { GuestCart, User } from "@/app/types/user";
import type { Order } from "@/types/order";
import type { Consignment } from "@/types/consignment";
import type { Sell } from "@/types/sell";
import type { Appointment } from "@/types/appointment";
import { MongoClient } from "mongodb";
import { Item } from "@/types/item";
import type { StoreSettings } from "@/types/settings";
import type { Enquiry } from "@/types/enquiry";
import type { PitchLead } from "@/types/pitch_lead";
import type { PrivateDemo, PrivateDemoData, PrivateDemoPhoto } from "@/types/private_demo";

let client: MongoClient | null = null;

export async function db() {
    if (!client) {
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
export const enquiries_collection = async () => (await db()).collection<Enquiry>("enquiries");
/** Dealers asking for a demo on /why. Not the admin's "Leads" page, which lists sell/consign requests. */
export const pitch_leads_collection = async () => (await db()).collection<PitchLead>("leads");
export const carts_collection = async () => (await db()).collection<GuestCart>("carts");
export const counters_collection = async () => (await db()).collection<{ _id: string; seq: number }>("counters");
export const settings_collection = async () => (await db()).collection<StoreSettings & { _id: string }>("settings");
/** Private per-lead demo stores (corlane.store/<slug>) and their photos. */
export const private_demos_collection = async () => (await db()).collection<PrivateDemo>("private_demos");
export const private_demo_photos_collection = async () => (await db()).collection<PrivateDemoPhoto>("private_demo_photos");

/** collected data about private demos after math */
export const collected_data_collection = async () => (await db()).collection<PrivateDemoData>("collected_data");

export {};
