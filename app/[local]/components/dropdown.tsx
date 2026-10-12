"use client";

import { useState } from "react";
import Arrow from "./svg/arrow";

export default function Dropdown({ children, titles }: { children: React.ReactNode[] | React.ReactNode; titles: string | string[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [IsActive, setIsActive] = useState<boolean>(false);

    return Array.isArray(titles) ? (
        <div className="w-full bg-background">
            {titles.map((title, index) => (
                <div key={title + index} className={`w-full flex flex-col gap-2 border-b-2 py-4 px-2`}>
                    <div className="w-full flex justify-start items-center gap-2" onClick={() => setActiveIndex(activeIndex === index ? null : index)}>
                        <Title title={title} active={activeIndex == index} />
                    </div>
                    <div className={`w-full overflow-hidden ms-6 pe-6 max-h-250 ${activeIndex == index ? "flex" : "hidden"}`}>{Array.isArray(children) ? children[index] : children}</div>
                </div>
            ))}
        </div>
    ) : (
        <div className="w-full bg-background">
            <div className={`w-full flex flex-col gap-2 border-b-2 py-4 px-2`}>
                <div className="w-full flex justify-start items-center gap-2" onClick={() => setIsActive(!IsActive)}>
                    <Title title={titles} active={IsActive} />
                </div>
                <div className={`w-full overflow-hidden max-h-250 ${IsActive ? "flex" : "hidden"}`}>{Array.isArray(children) ? <div className="w-full flex-center flex-col gap-4">{children}</div> : children}</div>
            </div>
        </div>
    );
}

function Title({ title, active = false }: { title: string; active: boolean }) {
    return (
        <>
            <h6 className="w-full cursor-pointer select-none">{title}</h6>
            <Arrow classnames={active ? "rotate-180 w-6" : "w-6"} />
        </>
    );
}
