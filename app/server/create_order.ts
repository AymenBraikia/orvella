"use server";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { orders_collection, users_collection } from "../db/collections";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notify_order_placed } from "./email/notifications";
import { build_quote, is_address_complete, normalise_currency, order_from_quote } from "./checkout";
import { reserve_items } from "./inventory";
import { next_order_number } from "./order_number";
import { get_settings } from "./settings";

export type BankOrderResult = { id: string } | { error: "auth" | "empty" | "address" | "unavailable" | "method"; items?: string[] };

/** Bank transfer: the order is placed now, the pieces are held until the dealer confirms the payment. */
export default async function create_order(): Promise<BankOrderResult> {
    const cookieStore = await cookies();
    const jwt_token = cookieStore.get("accessToken")?.value;

    const payload = jwt_token ? verifyJwt(jwt_token) : null;
    if (!payload) return { error: "auth" };

    const users = await users_collection();
    const user = await users.findOne({ email: payload.email });
    if (!user) return { error: "auth" };

    // Card payments are not wired to a payment provider yet; never create unpaid "card" orders.
    if (user.payment_method != "Bank Transfer") return { error: "method" };

    const quote = await build_quote(user.cart ?? [], user, normalise_currency(cookieStore.get("Currency")?.value));

    if (quote.unavailable.length) return { error: "unavailable", items: quote.unavailable };
    if (!quote.lines.length) return { error: "empty" };
    if (!is_address_complete(quote.address)) return { error: "address" };

    const id = await next_order_number();
    const { reservation_days, payments } = await get_settings();
    if (!payments.bank_transfer) return { error: "method" };

    const reserved_until = new Date(Date.now() + reservation_days * 24 * 60 * 60_000);

    const failed = await reserve_items(
        id,
        quote.lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
        reserved_until,
    );
    if (failed.length) return { error: "unavailable", items: quote.lines.filter((l) => failed.includes(l.slug)).map((l) => l.name) };

    const order = order_from_quote(id, quote, user, "Bank Transfer", reserved_until, await getLocale());
    await (await orders_collection()).insertOne({ ...order });

    // Customer gets the bank details, the dealer a heads-up — after the response, never blocking it.
    after(() => notify_order_placed(order));

    // The pieces now belong to this order; the cart starts fresh.
    await users.updateOne({ email: user.email }, { $pull: { cart: { slug: { $in: quote.lines.map((l) => l.slug) } } } });

    revalidatePath("/", "layout");

    return { id };
}
