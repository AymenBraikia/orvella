import Banner from "@/app/components/banner";
import Form from "./form";
import Order_list from "./order_list";
import StripeCancelled from "./stripe_cancelled";
import { get_checkout_customer } from "@/app/server/cart";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function checkoutPage({ searchParams }: { searchParams: Promise<{ stripe_cancelled?: string }> }) {
    const { stripe_cancelled } = await searchParams;
    // Signed-in customers and guests check out the same way.
    const customer = await get_checkout_customer();

    const t = await getTranslations("checkout");
    const cart = await getTranslations("cart");
    return (
        <div className="flex-center flex-col w-full gap-12 sm:px-20 py-5">
            <Banner>
                <h1 className="font-bold font-secondary">{t("heading")}</h1>
            </Banner>
            {stripe_cancelled && (
                <div className="w-full px-4">
                    <StripeCancelled order_id={stripe_cancelled} />
                </div>
            )}
            {!customer?.cart.length ? (
                <div className="flex-center w-full h-100 flex-col gap-4 font-secondary text-center px-4">
                    <h1>{t("heading")}</h1>
                    <Link className="text-2xl underline" href={"/shop"}>
                        {cart("emptyCta")}
                    </Link>
                </div>
            ) : (
                <div className="flex xl:flex-row flex-col justify-center items-start gap-4 xl:gap-20 w-full">
                    <div className="w-full xl:w-1/2 flex flex-col justify-start items-start gap-8 p-4">
                        <h2 className="text-gold capitalize font-secondary">{t("billing")}</h2>
                        <Form customer={customer} />
                    </div>

                    <div className="xl:w-1/2 w-full flex flex-col justify-start items-start gap-8 p-4">
                        <h2 className="font-secondary text-gold capitalize">{t("orderSummaryHeading")}</h2>
                        <div className="w-full h-fit">
                            <Order_list customer={customer} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
