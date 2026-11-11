import { getTranslations } from "next-intl/server";

type Message = { from: "buyer" | "dealer"; text: string };

/** A mock Instagram DM thread: the back-and-forth a buyer has to go through without a product page. */
export default async function InstagramThread() {
    const t = await getTranslations("why.visuals");
    const messages = t.raw("dm") as Message[];

    return (
        <div className="size-full flex flex-col bg-black text-white font-sans text-[11px] leading-snug">
            <div className="flex items-center gap-2 px-3 pt-8 pb-2 border-b border-neutral-800">
                <span aria-hidden="true" className="size-6 rounded-full bg-linear-to-tr from-amber-400 via-pink-500 to-purple-600" />
                <span className="font-semibold">yourshop</span>
            </div>
            <ul className="flex-1 flex flex-col justify-end gap-1.5 p-3">
                {messages.map(({ from, text }, i) => (
                    <li key={i} className={`max-w-[80%] px-3 py-2 rounded-2xl ${from == "dealer" ? "self-end bg-linear-to-br from-violet-600 to-blue-600" : "self-start bg-neutral-800"}`}>
                        {text}
                    </li>
                ))}
            </ul>
            <div aria-hidden="true" className="m-3 mt-0 h-7 rounded-full border border-neutral-700" />
        </div>
    );
}
