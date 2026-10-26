import { Item } from "@/app/(site)/lib/filters";
import { Order } from "./order";

export interface User {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    admin?: boolean;

    payment_method?: "PayPal" | "Credit/Debit Card" | "Bank Transfer";
    /** What is stored: slug + quantity (older documents may still hold full item snapshots). */
    cart: Cart_Line[];
    wish_list: Cart_Line[];
    ongoing_orders: Order[];
    fulfilled_orders: Order[];
    current_order?: Order;

    local_pickup: boolean;

    address: { shipping_costs: number; country: string; province?: string; address1: string | undefined; address2?: string; postCode: string | undefined; city: string | undefined; phone: string | undefined };
    diff_address: {
        shipping_costs: number;
        active: boolean;
        country: string;
        province?: string;
        address1: string | undefined;
        address2?: string | undefined;
        postCode: string | undefined;
        city: string | undefined;
        phone: string | undefined;
    };
}

export interface UserData {
    admin?: boolean;
    payment_method?: "PayPal" | "Credit/Debit Card" | "Bank Transfer";
    cart: User_Cart;
    wish_list: User_Cart;
    ongoing_orders: Order[];
    fulfilled_orders: Order[];
    current_order?: Order;
    first_name: string;
    last_name: string;
    local_pickup: boolean;
    email: string;
    address: { shipping_costs: number; country: string; province?: string; address1: string | undefined; address2?: string | undefined; postCode: string | undefined; city: string | undefined; phone: string | undefined };
    diff_address: { active: boolean; shipping_costs: number; country: string; province?: string; address1: string | undefined; address2?: string; postCode: string | undefined; city: string | undefined; phone: string | undefined };
}

export type User_Cart = Cart_Item[];

export type Cart_Line = { slug: string; quantity: number };

/** A cart line joined with the current catalogue data (see hydrate_cart). */
export type Cart_Item = Item & {
    quantity: number;
    /** Highest quantity the customer may choose; 0 when the piece is no longer available. */
    max_quantity: number;
};

export type UpdateUserProps = Partial<User>;
