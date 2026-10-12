import { AuthProvider } from "@/app/(site)/context/authContext";
import { CartProvider } from "@/app/(site)/context/cartContext";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import type { UserData } from "@/types/user";
import { Supported_Currencies } from "@/currency";
import { cookies } from "next/headers";

export default async function AuthShell({ session, children }: { session: UserData | undefined; children: React.ReactNode }) {

        const cookieStore = await cookies();
        const savedCurrency = (cookieStore.get("Currency")?.value as Supported_Currencies) || "USD";
    return (
        <AuthProvider initialSession={session}>
            <CartProvider>
                <Header savedCurrency={savedCurrency} />
                <div className="min-h-full flex-center flex-col max-w-dvw overflow-x-hidden pt-20">
                    {children}
                    <Footer />
                </div>
            </CartProvider>
        </AuthProvider>
    );
}
