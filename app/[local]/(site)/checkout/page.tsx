import Banner from "@/app/components/banner";
import Form from "./form";
import Order_list from "./order_list";
import getUser from "@/app/server/get_user";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function checkoutPage() {
    const user = await getUser();

    const t = await getTranslations("checkout");
    const cart = await getTranslations("cart");
    return (
        <div className="flex-center flex-col w-full gap-12 sm:px-20 py-5">
            <Banner>
                <h1 className="font-bold font-secondary">{t("heading")}</h1>
            </Banner>
            {!user!.cart.length ? (
                <div className="flex-center w-full h-100 flex-col gap-4 font-secondary text-center px-4">
                    <h1>{t("heading")}</h1>
                    <Link className="text-2xl underline" href={"/shop"}>
                        {cart("emptyCta")}
                    </Link>
                </div>
            ) : (
                <div className="flex xl:flex-row flex-col justify-center items-start gap-4 xl:gap-20 w-full">
                    <div className="w-full xl:w-1/2 flex flex-col justify-start items-start gap-8 p-4">
                        <h2 className="text-shine capitalize font-secondary">{t("billing")}</h2>
                        <Form />
                    </div>

                    <div className="xl:w-1/2 w-full flex flex-col justify-start items-start gap-8 p-4">
                        <h2 className="font-secondary text-shine capitalize">{t("orderSummaryHeading")}</h2>
                        <div className="w-full h-fit">
                            <Order_list />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
