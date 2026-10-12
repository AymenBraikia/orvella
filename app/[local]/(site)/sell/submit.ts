"use server";

import { consignments_collection, sell_collection } from "@/app/db/collections";
import { Consignment } from "@/types/consignment";
import { Sell } from "@/types/sell";

export default async function Submit(data: Consignment | Sell): Promise<boolean> {
    try {
        if (data.intent == "consign") await (await consignments_collection()).insertOne(data);
        else await (await sell_collection()).insertOne(data);

        return true;
    } catch (error) {
        console.error("failled to consign/sell: ", error);
        return false;
    }
}
