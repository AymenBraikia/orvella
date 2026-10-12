export default function HeroLoader() {
    return (
        <div className="flex-col flex-center gap-2 text-center w-dvw h-dvh fixed top-0 inset-s-0 text-white bg-background font-primary">
            <div className="sm:w-70 sm:h-13 w-32 h-9 loading"></div>
            <div className="sm:w-150 sm:h-13 w-93 h-6.5 max-w-[95dvw] loading"></div>
            <div className="sm:w-25 sm:h-8 w-19 h-6.5 loading"></div>
        </div>
    );
}
