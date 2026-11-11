/**
 * A product page: photos on one side, the details (`children`) on the other, stacked on phones.
 */
export default function ProductLayout({ gallery, children, before }: { gallery: React.ReactNode; children: React.ReactNode; before?: React.ReactNode }) {
    return (
        <div className="h-fit w-dvw py-4 xl:px-16 px-4 flex items-start justify-start flex-col lg:flex-row mt-10 gap-8 tracking-wider">
            {before}
            <div className="flex-center w-full lg:w-2/5">{gallery}</div>
            <div className="w-full lg:w-3/5 flex flex-col justify-start items-start font-secondary capitalize gap-6 lg:overflow-y-auto lg:max-h-[85dvh] px-1">{children}</div>
        </div>
    );
}
