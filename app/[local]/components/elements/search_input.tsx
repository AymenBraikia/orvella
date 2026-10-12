"use client";
import React, { Activity, useRef, useState } from "react";
import Search from "../svg/search";
import Cross from "../svg/cross";
import { useTranslations } from "next-intl";

interface searchProps {
    SearchChildComponent: React.ComponentType<{ item: any }>;
    SearchChildLoader: React.ComponentType;
    route: string;
    placeholder: string;
}

export default function Search_input({ route, SearchChildComponent, placeholder, SearchChildLoader }: searchProps) {
    const t = useTranslations("common.filters");

    const [data, set_data] = useState<any[]>([]);
    const [fetching, set_fetching] = useState<boolean>(false);
    const [active, set_active] = useState<boolean>(false);
    const [value, set_value] = useState<string>("");

    const timeout_ref = useRef<NodeJS.Timeout | null>(null);
    const request_id_ref = useRef(0);

    function handle_change(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.currentTarget.value;
        set_value(query);
        set_fetching(true);
        set_data([]);

        if (timeout_ref.current) clearTimeout(timeout_ref.current);

        timeout_ref.current = setTimeout(async () => {
            const this_request = ++request_id_ref.current;
            try {
                const res = await fetch(route + "/?query=" + encodeURIComponent(query));
                const json = await res.json();
                if (this_request === request_id_ref.current) {
                    set_data(json);
                    set_fetching(false);
                }
            } catch {
                if (this_request === request_id_ref.current) set_fetching(false);
            }
        }, 200);
    }

    return (
        <>
            <div className="flex-center gap-2 relative">
                <label htmlFor="searchWatches" className="md:block hidden">
                    <Search classnames="md:w-7" clr={"currentColor"} />
                </label>

                <button aria-label="Search" type="button" className="button2 md:hidden p-1" onClick={() => set_active(true)}>
                    <Search classnames="sm:w-8 w-5" clr={"currentColor"} />
                </button>

                <input autoComplete="off" onChange={handle_change} type="text" className={`placeholder:text-primary outline-0 md:block hidden`} placeholder={placeholder} id="searchWatches" />
                {data.length ? (
                    <div className="absolute hidden md:flex top-[calc(100%+8px)] inset-s-0 w-full min-w-100 max-w-100 h-fit max-h-100 overflow-y-auto flex-col bg-background font-secondary py-2">
                        {data.map((e, idx) => (
                            <SearchChildComponent key={idx} item={e} />
                        ))}
                    </div>
                ) : value ? (
                    <div className="absolute hidden md:flex-center top-[calc(100%+8px)] inset-s-0 w-full min-w-100 max-w-100 h-fit max-h-100 overflow-y-auto font-secondary py-2 bg-background">
                        {fetching ? (
                            <div className="w-full h-fit flex flex-col justify-start items-start">{Array.from({length:5}).map((e,i)=><SearchChildLoader key={i}/>)}</div>
                        ) : (
                            t("noSearchResults")
                        )}
                    </div>
                ) : (
                    <></>
                )}
            </div>
            <Activity mode={active ? "visible" : "hidden"}>
                <div className="fixed inset-s-0 top-0 fade-in w-dvw h-dvh bg-background z-70 p-6 pb-0 flex flex-col gap-4 md:hidden">
                    <button aria-label="close search" type="button" className="absolute top-4 inset-e-4 p-0 cursor-pointer" onClick={() => set_active(false)}>
                        <Cross classnames={"w-10"} />
                    </button>
                    <input autoComplete="off" onChange={handle_change} type="text" className={`placeholder:text-primary outline-0 md:hidden block w-[calc(100%-40px)] h-fit border-b`} placeholder={placeholder} id="searchWatches" />

                    {data.length ? (
                        <div className="flex md:hidden top-[calc(100%+8px)] w-full h-full flex-col font-secondary py-2 overflow-y-auto">
                            {data.map((e, idx) => (
                                <SearchChildComponent key={idx} item={e} />
                            ))}
                        </div>
                    ) : value ? (
                        <div className="flex md:hidden top-[calc(100%+8px)] inset-s-0 w-full h-fit overflow-y-auto font-secondary py-2 text-shine">
                            {fetching ? (
                                <div className="w-full h-fit flex flex-col justify-start items-start">{Array.from({length:5}).map((e,i)=><SearchChildLoader key={i}/>)}</div>
                            ) : (
                                t("noSearchResults")
                            )}
                        </div>
                    ) : (
                        <></>
                    )}
                </div>
            </Activity>
        </>
    );
}
