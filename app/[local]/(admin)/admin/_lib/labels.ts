import type { OrderStatus } from "@/types/order";
import type { LeadStatus } from "@/types/lead";
import type { AppointmentStatus } from "@/types/appointment";
import type { ItemStatus } from "@/types/item";

type Tone = "gold" | "green" | "red" | "blue" | "grey";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    pending_payment: "Pending payment",
    paid: "Paid",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
    pending_payment: "gold",
    paid: "blue",
    shipped: "blue",
    delivered: "green",
    cancelled: "grey",
    refunded: "red",
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
    new: "New",
    contacted: "Contacted",
    offer_made: "Offer made",
    closed: "Closed",
    rejected: "Rejected",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, Tone> = {
    new: "gold",
    contacted: "blue",
    offer_made: "blue",
    closed: "green",
    rejected: "grey",
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
    requested: "Requested",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    done: "Done",
};

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, Tone> = {
    requested: "gold",
    confirmed: "blue",
    cancelled: "grey",
    done: "green",
};

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = { available: "Available", reserved: "Reserved", sold: "Sold" };

export const ITEM_STATUS_TONE: Record<ItemStatus, Tone> = { available: "green", reserved: "gold", sold: "grey" };

export const ITEM_TYPE_LABEL = { watch: "Watch", ring: "Ring", bracelet: "Bracelet", necklace: "Necklace", spare: "Spare part" } as const;
