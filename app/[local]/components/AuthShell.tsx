import { AuthProvider } from "@/app/(site)/context/authContext";
import { CartProvider } from "@/app/(site)/context/cartContext";
import { CurrencyProvider } from "@/app/(site)/context/currencyContext";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import type { User_Cart, UserData } from "@/types/user";
import { Supported_Currencies } from "@/currency";
import { cookies } from "next/headers";
import { public_details, store_identity } from "@/app/server/store_identity";

export default async function AuthShell({ session, cart = [], children }: { session: UserData | undefined; cart?: User_Cart; children: React.ReactNode }) {

        const cookieStore = await cookies();
        const savedCurrency = (cookieStore.get("Currency")?.value as Supported_Currencies) || "USD";
        const store = public_details(await store_identity());
    return (
        <CurrencyProvider currency={savedCurrency}>
        <AuthProvider initialSession={session}>
            <CartProvider cart={cart}>
                <Header savedCurrency={savedCurrency} />
                <div className="min-h-full flex-center flex-col max-w-dvw overflow-x-hidden pt-20">
                    {children}
                    <Footer store={store} />
                </div>
            </CartProvider>
        </AuthProvider>
        </CurrencyProvider>
    );
}
