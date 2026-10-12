import NewCardLoader from "./newCard";

export default function NewLoader() {
    return (
        <section className="flex flex-col justify-center items-start sm:p-16 p-4 py-8 w-dvw gap-6" id="new">
            <div className="w-fit flex justify-center items-start flex-col">
                <h1 className="text-5xl font-secondary tracking-wide loading max-w-full w-60 h-10"></h1>
            </div>
            <div className="w-fit flex justify-center items-start flex-col">
                <p className="loading max-w-full w-140 h-5"></p>
            </div>
            <div className="w-fit flex justify-center items-start flex-col font-secondary">
                <p className="loading max-w-full w-30 h-5"></p>
            </div>
            <div className="w-full sm-w-fit flex-center gap-4">
                <div className="w-full">
                    <NewCardLoader />
                </div>
                <div className="w-full hidden sm:block">
                    <NewCardLoader />
                </div>
                <div className="w-full hidden lg:block">
                    <NewCardLoader />
                </div>
                <div className="w-full hidden xl:block">
                    <NewCardLoader />
                </div>
            </div>
        </section>
    );
}
