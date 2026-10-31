import { Supported_Currencies } from "@/currency";
import type { Item } from "./item";

export type OrderStatus = "pending_payment" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

export type PaymentMethod = "PayPal" | "Credit/Debit Card" | "Bank Transfer";

export type TaxMode = "included" | "added" | "margin_scheme";

export interface ShippingInfo {
    country_name: string;
    region: string;
    currency: string;
    shipping_cost: number;
    estimated_delivery: string;
    carrier: string;
    insurance_included: boolean;
    requires_signature: boolean;
    special_notes: string;
}

export interface OrderAddress {
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    postCode: string;
    country: string;
    phone?: string;
}

/** A purchased line, frozen at order time. Prices are in the order currency unless noted. */
export interface OrderLine {
    slug: string;
    type: Item["type"];
    name: string;
    reference?: string;
    image?: string;
    quantity: number;
    unit_price_eur: number;
    unit_price: number;
    total: number;
}

/** All in the order currency, major units (e.g. 1234.5 = €1,234.50). */
export interface OrderTotals {
    items: number;
    shipping: number;
    /** VAT added on top of the prices ("added" tax mode). */
    tax: number;
    /** VAT already contained in the prices ("included" tax mode) — informational only. */
    tax_included: number;
    discount: number;
    total: number;
}

export interface StatusEvent {
    status: OrderStatus;
    at: Date | string;
    note?: string;
    by?: string;
}

export interface Order {
    /** Human-friendly order number, also used as the bank transfer reference. */
    id: string;
    paypal_order_id?: string;
    paypal_capture_id?: string;
    /** PayPal webhook events already handled, so a resend changes nothing. */
    paypal_events?: string[];
    stripe_session_id?: string;
    stripe_payment_intent?: string;

    email: string;
    /** Placed without an account: reachable with access_token, payable from the guest cart's browser. */
    guest?: boolean;
    cart_id?: string;
    access_token?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    locale?: string;

    items: OrderLine[];
    currency: Supported_Currencies;
    /** 1 EUR = exchange_rate units of `currency` at the time the order was placed. */
    exchange_rate: number;
    totals: OrderTotals;
    tax: { mode: TaxMode; rate: number };

    payment_method: PaymentMethod;
    shipping: ShippingInfo | false;
    address: "Local Pickup" | OrderAddress;

    status: OrderStatus;
    status_history: StatusEvent[];
    reserved_until?: Date | string;
    /** Pieces that could not be taken out of stock when payment arrived (oversold). */
    stock_conflicts?: string[];

    tracking?: { carrier: string; number: string };
    admin_notes?: string;

    created_at: Date | string;
    updated_at?: Date | string;
}

export interface capture_result {
    id: string;
    status: "COMPLETED" | "DECLINED" | "PARTIALLY_REFUNDED" | "PENDING" | "REFUNDED" | "FAILED" | string;
    purchase_units: {
        reference_id?: string;
        shipping?: {
            name?: {
                full_name: string;
            };
            address: {
                address_line_1: string;
                address_line_2?: string;
                admin_area_2: string; // City
                admin_area_1: string; // State/Province
                postal_code: string;
                country_code: string;
            };
        };
        payments?: {
            captures: {
                id: string; // This is the actual Capture ID
                status: string;
                amount: {
                    currency_code: string;
                    value: string;
                };
                create_time: string;
                update_time: string;
            }[];
        };
    }[];
    payer?: {
        name: {
            given_name: string;
            surname: string;
        };
        email_address: string;
        payer_id: string;
    };
    links?: {
        href: string;
        rel: string;
        method: string;
    }[];
}
