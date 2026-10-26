import type { Item } from "@/types/item";
import { brand_name } from "./brand_name";

/** Watches and spares are named by brand + model; jewelry has its own display name. */
export function item_name(item: Item): string {
    return item.type == "watch" || item.type == "spare" ? `${brand_name(item.brand)} ${item.model}` : item.display_name;
}
