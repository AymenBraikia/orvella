import "server-only";

import shipping_data from "@/app/shipping.json";
import { eur_value_in_currency, Supported_Currencies, supported_currencies } from "@/currency";
import { compute_totals, from_minor, TaxConfig, Totals } from "@/app/(site)/lib/order_totals";
import { max_cart_quantity } from "@/app/(site)/lib/stock";
import { item_name } from "@/app/(site)/lib/item_name";
import { read_items_fresh } from "./inventory";
import update_currency_rates from "./update_currency_rates";
import type { Order, OrderAddress, OrderLine, OrderTotals, ShippingInfo } from "@/types/order";
import type { Cart_Line, User } from "@/types/user";

/** How long an online payment (PayPal) may take before the pieces go back on sale. */
export const ONLINE_RESERVATION_MINUTES = 15;

/** Bank transfers hold the pieces this many days (until the dealer marks payment received or cancels). Becomes a setting in 1.5. */
export const BANK_RESERVATION_DAYS = 3;

/** Until settings exist (task 1.5): prices include VAT, nothing is added at checkout. */
export const DEFAULT_TAX: TaxConfig = { mode: "included", rate: 19 };

const shipping_values = Object.values(shipping_data) as ShippingInfo[];

export function shipping_for_country(country: string | undefined): ShippingInfo | undefined {
    return shipping_values.find((e) => e.country_name == country);
}

/** 1 EUR in `currency`. Throws rather than silently charging at a 1:1 rate. */
export async function get_exchange_rate(currency: Supported_Currencies): Promise<number> {
    if (currency === "EUR") return 1;

    let rate = eur_value_in_currency.get(currency);
    if (!rate) {
        await update_currency_rates();
        rate = eur_value_in_currency.get(currency);
    }
    if (!rate) throw new Error(`No exchange rate available for ${currency}`);

    return rate;
}

export function normalise_currency(value: string | undefined): Supported_Currencies {
    return supported_currencies.includes(value as Supported_Currencies) ? (value as Supported_Currencies) : "EUR";
}

type CustomerDetails = Pick<User, "local_pickup" | "address" | "diff_address">;

export function delivery_address(user: CustomerDetails): "Local Pickup" | OrderAddress {
    if (user.local_pickup) return "Local Pickup";

    const source = user.diff_address?.active ? user.diff_address : user.address;

    return {
        address1: source.address1 ?? "",
        address2: source.address2,
        city: source.city ?? "",
        province: source.province,
        postCode: source.postCode ?? "",
        country: source.country ?? "",
        phone: source.phone,
    };
}

export function is_address_complete(address: "Local Pickup" | OrderAddress): boolean {
    if (address === "Local Pickup") return true;
    return Boolean(address.address1 && address.city && address.postCode && address.country && shipping_for_country(address.country));
}

export type Quote = {
    lines: OrderLine[];
    /** Names of pieces that can no longer be bought (sold, reserved, removed or quantity too high). */
    unavailable: string[];
    currency: Supported_Currencies;
    exchange_rate: number;
    tax: TaxConfig;
    shipping: ShippingInfo | false;
    address: "Local Pickup" | OrderAddress;
    minor: Totals;
    totals: OrderTotals;
};

/**
 * Price a cart from the database — never from what the cart or the browser says. Used for the
 * summaries shown to the customer and, unchanged, for the order that gets charged.
 */
export async function build_quote(cart: Cart_Line[], customer: CustomerDetails, currency: Supported_Currencies, tax: TaxConfig = DEFAULT_TAX): Promise<Quote> {
    const wanted = cart.filter((l) => l.quantity > 0);
    const items = await read_items_fresh(wanted.map((l) => l.slug));
    const now = Date.now();

    const unavailable: string[] = [];
    const priced: { line: Cart_Line; item: (typeof items)[number] }[] = [];

    for (const line of wanted) {
        const item = items.find((i) => i.slug === line.slug);
        if (!item || item.deleted) {
            unavailable.push(line.slug);
            continue;
        }
        if (line.quantity > max_cart_quantity(item, now)) unavailable.push(item_name(item));
        priced.push({ line, item });
    }

    const address = delivery_address(customer);
    const shipping = address === "Local Pickup" ? false : (shipping_for_country(address.country) ?? false);

    const exchange_rate = await get_exchange_rate(currency);

    const minor = compute_totals({
        lines: priced.map(({ line, item }) => ({ unit_price_eur: item.price, quantity: line.quantity })),
        shipping_eur: shipping ? shipping.shipping_cost : 0,
        currency,
        rate: exchange_rate,
        tax,
    });

    const major = (n: number) => from_minor(n, currency);

    const lines: OrderLine[] = priced.map(({ line, item }, i) => ({
        slug: item.slug,
        type: item.type,
        name: item_name(item),
        reference: item.type == "watch" || item.type == "spare" ? item.reference : undefined,
        image: item.images?.[0],
        quantity: line.quantity,
        unit_price_eur: item.price,
        unit_price: major(minor.unit_minor[i]),
        total: major(minor.line_minor[i]),
    }));

    return {
        lines,
        unavailable,
        currency,
        exchange_rate,
        tax,
        shipping,
        address,
        minor,
        totals: {
            items: major(minor.items_minor),
            shipping: major(minor.shipping_minor),
            tax: major(minor.tax_minor),
            tax_included: major(minor.tax_included_minor),
            discount: major(minor.discount_minor),
            total: major(minor.total_minor),
        },
    };
}

/** The order document for a quote that has just been reserved. */
export function order_from_quote(id: string, quote: Quote, user: Pick<User, "email" | "firstName" | "lastName">, payment_method: Order["payment_method"], reserved_until: Date, locale?: string): Order {
    const now = new Date();
    const phone = quote.address === "Local Pickup" ? undefined : quote.address.phone;

    return {
        id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone,
        locale,
        items: quote.lines,
        currency: quote.currency,
        exchange_rate: quote.exchange_rate,
        totals: quote.totals,
        tax: quote.tax,
        payment_method,
        shipping: quote.shipping,
        address: quote.address,
        status: "pending_payment",
        status_history: [{ status: "pending_payment", at: now, note: `Order placed (${payment_method})` }],
        reserved_until,
        created_at: now,
        updated_at: now,
    };
}
