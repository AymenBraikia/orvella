import { getTranslations } from "next-intl/server";

type TermSection = {
    number: string;
    heading: string;
    intro?: string;
    text?: string;
    items?: string[];
    subsections?: {
        heading: string;
        items?: string[];
        text?: string;
    }[];
};

export default async function TermsPage() {
    const t = await getTranslations("legal.terms");

    const index = t.raw("index") as string[];
    const sections = t.raw("sections") as TermSection[];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 text-[14px]">
                <h3>{t("indexHeading")}</h3>

                <ul className="list-disc list-inside text-[16px]">
                    {index.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>

                <p className="font-bold">{t("acceptanceNote")}</p>

                {sections.map((section) => (
                    <section key={section.number}>
                        <h4 className="font-semibold">
                            {section.number}. {section.heading}
                        </h4>

                        {section.intro && <p className="ms-4">{section.intro}</p>}

                        {section.text && <p className="ms-4">{section.text}</p>}

                        {section.items && (
                            <ul className="list-disc list-inside ms-4">
                                {section.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}

                        {section.subsections?.map((subsection) => (
                            <div key={subsection.heading}>
                                <p className="ms-4">{subsection.heading}</p>

                                {subsection.text && <p className="ms-4">{subsection.text}</p>}

                                {subsection.items && (
                                    <ul className="list-disc list-inside ms-8">
                                        {subsection.items.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                ))}
            </div>
        </div>
    );
}
