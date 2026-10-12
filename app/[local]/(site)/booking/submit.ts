"use server";

import { appointments_collection } from "@/app/db/collections";
import { Appointment } from "@/types/appointment";

export default async function Submit(data: Appointment): Promise<boolean> {
    try {
        (await appointments_collection()).insertOne(data);

        return true;
    } catch (error) {
        console.error("failled to consign/sell: ", error);
        return false;
    }
}
