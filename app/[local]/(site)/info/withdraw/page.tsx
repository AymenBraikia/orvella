import { getTranslations } from "next-intl/server";

export default async function WithdrawalPage() {
    const t = await getTranslations("legal.withdrawal");

    const rightItems = t.raw("rightItems") as string[];
    const consequencesItems = t.raw("consequencesItems") as string[];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 text-[14px] w-full max-w-3xl">
                <p>{t("intro")}</p>

                <h4 className="font-semibold">{t("rightHeading")}</h4>
                <ol className="list-decimal list-inside ms-4">
                    {rightItems.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ol>

                <h4 className="font-semibold">{t("consequencesHeading")}</h4>
                <ol className="list-decimal list-inside ms-4">
                    {consequencesItems.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ol>

                <h4 className="font-semibold">{t("formHeading")}</h4>
                <p className="ms-4">{t("formNote")}</p>

                <form className="w-full mt-4 flex flex-col gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div>
                            <label className="block text-sm font-medium">{t("form.orderNumber")}</label>
                            <input required type="text" className="outline-none mt-1 block w-full border-b border-gray-300 px-3 py-2" name="orderNumber" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">{t("form.email")}</label>
                            <input required type="email" className="outline-none mt-1 block w-full border-b border-gray-300 px-3 py-2" name="email" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div>
                            <label className="block text-sm font-medium">{t("form.firstName")}</label>
                            <input required type="text" className="outline-none mt-1 block w-full border-b border-gray-300 px-3 py-2" name="firstName" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">{t("form.lastName")}</label>
                            <input required type="text" className="outline-none mt-1 block w-full border-b border-gray-300 px-3 py-2" name="lastName" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">{t("form.comment")}</label>
                        <textarea className="outline-none mt-1 block w-full border border-gray-300 rounded px-3 py-2" rows={4} name="comment" />
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="submit" className="button px-4 py-2 rounded cursor-pointer">
                            {t("form.submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
