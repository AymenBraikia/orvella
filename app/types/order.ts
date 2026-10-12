import { Supported_Currencies } from "@/currency";
import { Cart_Item } from "./user";

export interface Order {
    id: string;
    items: Cart_Item[];
    currency: Supported_Currencies;
    payment_method: "PayPal" | "Credit/Debit Card" | "Bank Transfer";
    shipping:
        | {
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
        | false;
    address:
        | "Local Pickup"
        | {
              address1: string;
              address2?: string;
              city: string;
              postCode: string;
              country: string;
          };
    total: number;
    discount_amount: number;
    amount_to_pay: number;
    status: "Pending" | "Failed" | "Completed";
    email: string;
    created_at: Date;
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

    redirect?: string;
}
