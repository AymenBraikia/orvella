import Image from "next/image";

/**
 * The product card of the New Arrivals carousel: square photo that dims and zooms on hover, name
 * and price. The storefront adds its stock badge, quick view and add-to-cart (`badge`, `actions`,
 * `onClick`).
 */
export default function ProductCardView({
    name,
    price,
    image,
    badge,
    actions,
    onClick,
}: {
    name: string;
    price: React.ReactNode;
    image: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <div aria-label={`${name}`} className="h-fit sm:h-110 w-full flex flex-col justify-start items-start gap-4 transition-long group" onClick={onClick}>
            <div className="relative w-full sm:h-fit flex-center overflow-hidden aspect-square">
                {badge}
                <Image
                    src={image}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    fill
                    alt={name}
                    className="object-contain select-none scale-100 brightness-100 transition-long group-hover:scale-105 group-hover:brightness-50"
                />
                {actions}
            </div>
            <div className="w-full flex flex-col justify-start items-start max-h-30 min-h-20">
                <h5 className="sm:title6 title4 font-secondary capitalize text-shine">{name}</h5>
                <h6 className="sm:title6 title5 font-secondary">{price}</h6>
            </div>
        </div>
    );
}
