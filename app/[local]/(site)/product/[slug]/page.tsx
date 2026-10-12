import { after } from "next/server";
import AtcBtn from "@/app/components/buttons/addToCart";
import { format_price } from "../../lib/price_format";
import get_product from "./get_product";
import Images_list from "./images";
import Link from "next/link";
import InfoTable from "./info_table";
import increase_relevance_score from "@/app/server/increase_relevance_score";
import score_rewards from "../../lib/relevance_score";
import { getTranslations } from "next-intl/server";
import { get_Currency } from "../../lib/get_currency";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function DynamicPage({ params }: PageProps) {
    const slug = (await params).slug;
    const data = await get_product(slug);
    const t = await getTranslations("product");
    const country = await get_Currency();

    after(() => increase_relevance_score(slug, score_rewards.view_details));

    return (
        <div className="h-fit w-dvw py-4 xl:px-16 px-4 flex items-start justify-start flex-col lg:flex-row mt-10 gap-8 tracking-wider">
            <div className="flex-center w-full lg:w-2/5">
                <Images_list data={data} />
            </div>
            <div className="w-full lg:w-3/5 flex flex-col justify-start items-start font-secondary capitalize gap-6 lg:overflow-y-auto lg:max-h-[85dvh] px-1">
                <h1 className="tracking-wider">{data.brand + " " + data.model}</h1>
                <p className="font-sans text-shine tracking-widest leading-8">{data.description}</p>
                <h3>{t("reference") + data.reference}</h3>
                <h3>{format_price(data.price, country)}</h3>
                <h4>{t("stock") + ": " + (data.inStock ? t("available") : t("notAvailable"))}</h4>
                <div className="flex-center gap-2 w-full flex-wrap sm:flex-nowrap lg:flex-wrap xl:flex-nowrap text-sm sm:text-base">
                    <div className="2xl:w-2/5 font-sans xl:w-1/3 lg:w-full sm:w-1/3 w-full">
                        <AtcBtn slug={data.slug} />
                    </div>
                    <div className="flex-center gap-2 font-sans 2xl:w-3/5 xl:w-2/3 lg:w-full sm:w-2/3 w-full flex-wrap sm:flex-nowrap">
                        <Link href="/store" className="flex-center button w-full">
                            {t("findInStore")}
                        </Link>
                        <Link href="/booking" className="flex-center button w-full">
                            {t("bookAppointment")}
                        </Link>
                    </div>
                </div>
                <InfoTable watch={data} />
            </div>
        </div>
    );
}
