export default function NewCardLoader() {
    return (
        <div className="h-130 sm:h-110 w-full flex flex-col justify-start items-start gap-4">
            <div className="relative w-full h-9/10 sm:h-fit flex-center overflow-hidden sm:aspect-square loading"></div>
            <div className="w-full flex flex-col justify-start items-start max-h-30 min-h-25 gap-2">
                <div className="w-full h-8 loading"></div>
                <div className="w-30 h-8 loading"></div>
            </div>
        </div>
    );
}