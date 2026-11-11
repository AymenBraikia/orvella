import getUser from "@/app/server/get_user";
import { hydrate_cart, read_cart_lines } from "@/app/server/cart";
import AuthShell from "./AuthShell";

export default async function AuthGate({ children }: { children: React.ReactNode }) {
    const session = await getUser();
    // Guests have a cart too (kept by the cart_id cookie).
    const cart = session ? session.cart : await hydrate_cart(await read_cart_lines());
    return (
        <AuthShell session={session} cart={cart}>
            {children}
        </AuthShell>
    );
}
