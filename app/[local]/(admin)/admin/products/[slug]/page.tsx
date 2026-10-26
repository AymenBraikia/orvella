import { notFound } from "next/navigation";
import { items_collection } from "@/app/db/collections";
import ProductForm from "../_components/product_form";
import { form_from_item } from "../defaults";
import { Badge, PageHeader } from "../../_components/ui";
import { item_name } from "@/app/(site)/lib/item_name";
import { stock_status } from "@/app/(site)/lib/stock";
import { ITEM_STATUS_LABEL, ITEM_STATUS_TONE, ITEM_TYPE_LABEL } from "../../_lib/labels";
import RowActions from "../_components/row_actions";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const item = await (await items_collection()).findOne({ slug: decodeURIComponent(slug) }, { projection: { _id: 0 } });
    if (!item) notFound();

    const plain = JSON.parse(JSON.stringify(item));
    const status = stock_status(item);

    return (
        <>
            <PageHeader title={item_name(item)} subtitle={`${ITEM_TYPE_LABEL[item.type]} · ${item.slug}`}>
                <Badge tone={ITEM_STATUS_TONE[status]}>{ITEM_STATUS_LABEL[status]}</Badge>
                {item.deleted && <Badge tone="red">Deleted</Badge>}
                <RowActions slug={item.slug} status={status} featured={Boolean(item.featured)} deleted={Boolean(item.deleted)} />
            </PageHeader>
            <ProductForm key={item.slug} initial={form_from_item(plain)} original_slug={item.slug} />
        </>
    );
}
