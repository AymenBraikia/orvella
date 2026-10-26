import ProductForm from "../_components/product_form";
import { empty_product } from "../defaults";
import { PageHeader } from "../../_components/ui";
import { PRODUCT_TYPES, type ProductType } from "../schema";

export const metadata = { title: "New product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const { type } = await searchParams;
    const initial_type: ProductType = PRODUCT_TYPES.includes(type as ProductType) ? (type as ProductType) : "watch";

    return (
        <>
            <PageHeader title="New product" subtitle="It appears in the shop as soon as you save." />
            <ProductForm initial={empty_product(initial_type)} />
        </>
    );
}
