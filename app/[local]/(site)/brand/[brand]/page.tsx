import Watches_list from "@/app/components/watches_list";
import get_brand from "../get_brand";

interface PageProps {
    params: Promise<{
        brand: string;
    }>;
}

export default async function DynamicPage({ params }: PageProps) {
    const brand = (await params).brand.replace("%20", " ").toLowerCase().trim();
    const data = await get_brand(brand);

    return (
        <div className="h-fit w-dvw py-4 sm:px-16 px-4 flex-center flex-col mt-10">
            <div className="w-full flex flex-col justify-start items-start gap-4">
                <h1 className="capitalize font-secondary">{brand}</h1>
                <Description brand={brand} />
            </div>
            {<Watches_list watches={data} />}
        </div>
    );
}
function Description({ brand }: { brand: string }) {
    const wrapperClass = "hidden sm:flex flex-col w-full h-fit gap-4 text-sm tracking-widest leading-5";

    switch (brand) {
        case "rolex":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Founding and Early Years</h6>
                    <p className="font-secondary">
                        Rolex, the renowned luxury watchmaker, was founded in 1905 by Hans Wilsdorf and Alfred Davis in London, England. Initially, the company was named “Wilsdorf and Davis,” and it focused on distributing timepieces.
                        Wilsdorf had a vision to create wristwatches that were both precise and elegant, which was a significant challenge at a time when pocket watches were the norm.
                    </p>
                    <h6 className="font-medium text-shine">Move to Switzerland and Birth of the Rolex Brand</h6>
                    <p className="font-secondary">
                        In 1908, the Rolex brand was registered, and the company name was officially changed to Rolex. Wilsdorf chose the name because it was short, easy to pronounce in any language, and could fit neatly on the dial of a
                        watch. To further enhance the reputation of Rolex for precision, the company moved to Geneva, Switzerland, in 1919.
                    </p>
                </div>
            );

        case "audemars piguet":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Origins in the Vallée de Joux</h6>
                    <p className="font-secondary">
                        Audemars Piguet was founded in 1875 by Jules Louis Audemars and Edward Auguste Piguet in the village of Le Brassus, Switzerland. The brand quickly established itself as a master of complex watch mechanics,
                        specializing in minute repeaters, perpetual calendars, and chronographs.
                    </p>
                    <h6 className="font-medium text-shine">The Royal Oak Revolution</h6>
                    <p className="font-secondary">
                        In 1972, Audemars Piguet disrupted the industry by introducing the Royal Oak. Designed by Gérald Genta, it was the world's first luxury sports watch made of stainless steel, featuring a distinctive octagonal bezel
                        with exposed screws, cementing the brand's place in modern horology.
                    </p>
                </div>
            );

        case "blancpain":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Oldest Watchmaking Brand</h6>
                    <p className="font-secondary">
                        Founded in 1735 by Jehan-Jacques Blancpain in Villeret, Switzerland, Blancpain holds the title of the oldest registered watchmaking brand in the world. For centuries, the company has adhered strictly to traditional
                        mechanical watchmaking, famously declaring that it has never made a quartz watch and never will.
                    </p>
                    <h6 className="font-medium text-shine">The Fifty Fathoms</h6>
                    <p className="font-secondary">
                        In 1953, Blancpain released the Fifty Fathoms, largely considered the first modern dive watch. Created in collaboration with the French Navy's elite combat divers, it established the blueprint for dive watches with
                        its unidirectional rotating bezel and exceptional water resistance.
                    </p>
                </div>
            );

        case "breitling":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Pioneers of the Chronograph</h6>
                    <p className="font-secondary">
                        Founded in 1884 by Léon Breitling in Saint-Imier, Switzerland, Breitling initially focused on precision chronographs for sports, science, and industry. In 1915, the brand invented the first independent chronograph
                        pusher, a crucial development in modern watchmaking.
                    </p>
                    <h6 className="font-medium text-shine">Aviation Heritage</h6>
                    <p className="font-secondary">
                        Breitling is intrinsically linked to aviation. In 1952, they introduced the Navitimer, featuring a complex circular slide rule bezel designed to help pilots perform critical in-flight calculations, making it the
                        ultimate tool watch for aviators.
                    </p>
                </div>
            );

        case "cartier":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Jeweler of Kings</h6>
                    <p className="font-secondary">
                        Founded in Paris in 1847 by Louis-François Cartier, the Maison initially built its reputation creating exquisite jewelry for royalty. It wasn't long before Cartier brought its unparalleled design sensibilities into
                        the world of horology, merging elegance with function.
                    </p>
                    <h6 className="font-medium text-shine">Birth of the Men's Wristwatch</h6>
                    <p className="font-secondary">
                        In 1904, Louis Cartier designed a flat wristwatch with a distinctive square bezel for his friend, the pioneering aviator Alberto Santos-Dumont. The "Santos" is widely recognized as the first purpose-designed men's
                        wristwatch, preceding iconic designs like the Tank, which debuted in 1917.
                    </p>
                </div>
            );

        case "chopard":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Swiss Precision Meets High Jewelry</h6>
                    <p className="font-secondary">
                        Founded in 1860 by Louis-Ulysse Chopard in Sonvilier, Switzerland, the company began by crafting highly accurate pocket watches and chronometers. Chopard quickly gained fame for supplying timepieces to the Swiss
                        Railway and Tsar Nicholas II of Russia.
                    </p>
                    <h6 className="font-medium text-shine">The Happy Diamonds and L.U.C</h6>
                    <p className="font-secondary">
                        Acquired by the Scheufele family in 1963, Chopard expanded into fine jewelry, famously launching the "Happy Diamonds" collection. In 1996, the brand returned to its *haute horlogerie* roots by establishing the
                        Chopard Manufacture and introducing the critically acclaimed L.U.C mechanical movements.
                    </p>
                </div>
            );

        case "chronoswiss":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">A Modern Renaissance</h6>
                    <p className="font-secondary">
                        Founded in 1983 by Gerd-Rüdiger Lang in Munich, Germany (later relocating to Lucerne, Switzerland), Chronoswiss was established during the height of the Quartz Crisis. Lang's vision was a defiant return to the
                        artistry of mechanical watchmaking when the industry was pivoting to battery power.
                    </p>
                    <h6 className="font-medium text-shine">The Regulator Aesthetic</h6>
                    <p className="font-secondary">
                        Chronoswiss is highly recognized for reviving the "Regulator" dial layout, where hours, minutes, and seconds are displayed on separate axes. Their timepieces are easily identifiable by their signature onion crowns,
                        coined-edge bezels, and complex guilloché dials.
                    </p>
                </div>
            );

        case "corum":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Avant-Garde Design in La Chaux-de-Fonds</h6>
                    <p className="font-secondary">
                        Founded in 1955 by Gaston Ries and René Bannwart, Corum quickly established a reputation for highly creative and unconventional watch designs. Their emblem, an upright key, symbolizes the brand's drive to unlock new
                        horological mysteries.
                    </p>
                    <h6 className="font-medium text-shine">Iconic Collections</h6>
                    <p className="font-secondary">
                        Corum is best known for the "Golden Bridge," introduced in 1980, featuring a spectacular linear movement suspended in a transparent sapphire case. The brand is also famous for the "Admiral's Cup," recognized by its
                        twelve-sided case and nautical pennants on the dial.
                    </p>
                </div>
            );

        case "frank muller":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Master of Complications</h6>
                    <p className="font-secondary">
                        Founded in Geneva in 1991 by watchmaker Franck Muller and case-maker Vartan Sirmakes, the brand quickly soared to prominence. Muller's exceptional talent for creating complex movements earned him the title "Master of
                        Complications," releasing world premieres with unprecedented technical mechanisms.
                    </p>
                    <h6 className="font-medium text-shine">The Cintrée Curvex</h6>
                    <p className="font-secondary">
                        Beyond the complex mechanics, the brand is defined by its iconic Cintrée Curvex case—a distinctive tonneau (barrel) shape with dramatic curves. Combined with oversized, stylized numerals, Franck Muller watches offer
                        a bold, instantly recognizable aesthetic.
                    </p>
                </div>
            );

        case "girard perregaux":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Centuries of Innovation</h6>
                    <p className="font-secondary">
                        Tracing its roots back to 1791 with watchmaker Jean-François Bautte, and officially formed in 1852 by Constant Girard, Girard-Perregaux is one of the oldest true manufactures in Switzerland. The brand has a long
                        history of developing their movements entirely in-house.
                    </p>
                    <h6 className="font-medium text-shine">The Tourbillon with Three Gold Bridges</h6>
                    <p className="font-secondary">
                        The brand's most legendary creation is the Tourbillon with Three Gold Bridges, a masterpiece introduced as a pocket watch in the 1860s that won a gold medal at the 1889 Paris Universal Exhibition. It elevated the
                        movement's bridge from a functional component into a celebrated design element.
                    </p>
                </div>
            );

        case "glashütte original":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">German Watchmaking Heritage</h6>
                    <p className="font-secondary">
                        Glashütte Original carries the torch of traditional German watchmaking, originating in the town of Glashütte in 1845. After World War II and the division of Germany, the town's watchmaking enterprises were
                        consolidated into a state-owned entity known as GUB.
                    </p>
                    <h6 className="font-medium text-shine">Rebirth and Fine Finishing</h6>
                    <p className="font-secondary">
                        Following German reunification in 1990, the company was privatized and rebranded as Glashütte Original. Today, it is revered for its in-house manufacturing, robust designs, and traditional Saxon finishings, such as
                        the three-quarter plate, swan-neck fine adjustment, and Glashütte ribbing.
                    </p>
                </div>
            );

        case "grand seiko":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Pursuit of the Ideal Watch</h6>
                    <p className="font-secondary">
                        Created in 1960 by a dedicated team at Seiko, Grand Seiko was born from a desire to build the "ideal" watch—one that excelled in precision, durability, and beauty. The brand challenged the dominance of Swiss
                        chronometry by winning prestigious observatory trials in the late 1960s.
                    </p>
                    <h6 className="font-medium text-shine">Spring Drive and Nature-Inspired Dials</h6>
                    <p className="font-secondary">
                        Grand Seiko is famous for its Zaratsu polishing, creating distortion-free mirror finishes. They also introduced the revolutionary Spring Drive movement, combining mechanical force with an electromagnetic brake for
                        unparalleled accuracy, often paired with stunning dials inspired by the Japanese landscape.
                    </p>
                </div>
            );

        case "hublot":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Art of Fusion</h6>
                    <p className="font-secondary">
                        Founded in 1980 by Italian Carlo Crocco, Hublot shocked the traditional watchmaking world by being the first brand to pair a precious metal case (gold) with a natural rubber strap. This daring combination birthed the
                        brand's core philosophy: "The Art of Fusion."
                    </p>
                    <h6 className="font-medium text-shine">The Big Bang Era</h6>
                    <p className="font-secondary">
                        Under the leadership of Jean-Claude Biver in 2005, Hublot released the "Big Bang," a massively successful chronograph that took the fusion concept to the extreme. The brand continues to innovate with proprietary
                        materials like Magic Gold (scratch-resistant gold) and vibrant colored sapphires.
                    </p>
                </div>
            );

        case "iwc":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">American Engineering, Swiss Craftsmanship</h6>
                    <p className="font-secondary">
                        The International Watch Company (IWC) was founded in Schaffhausen in 1868 by American engineer Florentine Ariosto Jones. His goal was to combine advanced American manufacturing techniques with the exceptional skill
                        of Swiss craftsmen to produce high-quality pocket watch movements.
                    </p>
                    <h6 className="font-medium text-shine">Masters of the Skies and Seas</h6>
                    <p className="font-secondary">
                        IWC is universally celebrated for its robust tool watches. Their Pilot's Watches line, dating back to the 1930s, defined the aviation aesthetic, while the elegant Portugieser and the rugged Aquatimer collections
                        showcase the brand's mastery over sophisticated complications and durable engineering.
                    </p>
                </div>
            );

        case "jaeger-lecoultre":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Watchmaker of Watchmakers</h6>
                    <p className="font-secondary">
                        Founded in 1833 by Antoine LeCoultre in the Vallée de Joux, Jaeger-LeCoultre is frequently referred to as the "watchmaker's watchmaker." Over its history, the manufacture has created over 1,200 different calibers and
                        supplied movements to brands like Patek Philippe, Audemars Piguet, and Vacheron Constantin.
                    </p>
                    <h6 className="font-medium text-shine">The Iconic Reverso</h6>
                    <p className="font-secondary">
                        In 1931, the brand introduced the Reverso, a watch born from a request by British army officers in India who needed a timepiece that could survive polo matches. The clever reversible case protected the crystal and
                        became an enduring symbol of Art Deco design.
                    </p>
                </div>
            );

        case "junghans":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Black Forest Giant</h6>
                    <p className="font-secondary">
                        Founded in 1861 by Erhard Junghans in Schramberg, Germany, Junghans grew rapidly to become the largest clock manufacturer in the world by the early 20th century. The brand has a deep history of producing accessible,
                        high-quality timepieces.
                    </p>
                    <h6 className="font-medium text-shine">Bauhaus and Radio Control</h6>
                    <p className="font-secondary">
                        Junghans is synonymous with minimalist Bauhaus design, heavily influenced by their collaboration with artist and architect Max Bill in the 1950s. Furthermore, they pioneered modern timekeeping by releasing the Mega 1
                        in 1990, the world's first radio-controlled wristwatch.
                    </p>
                </div>
            );

        case "nomos":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Modern Glashütte Minimalism</h6>
                    <p className="font-secondary">
                        Founded by Roland Schwertner in 1990, just months after the fall of the Berlin Wall, NOMOS Glashütte brought a fresh, modern perspective to the historic German watchmaking town. The brand is strictly dedicated to
                        mechanical watchmaking and builds its calibers in-house.
                    </p>
                    <h6 className="font-medium text-shine">Bauhaus Inspiration</h6>
                    <p className="font-secondary">
                        NOMOS is celebrated for its award-winning, minimalist aesthetics heavily inspired by the Bauhaus movement and the Deutscher Werkbund. Models like the Tangente and Orion have become modern classics, characterized by
                        clean typography, slender hands, and slim profiles.
                    </p>
                </div>
            );

        case "omega":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">A Legacy of Precision</h6>
                    <p className="font-secondary">
                        Founded in 1848 by Louis Brandt in La Chaux-de-Fonds, Omega has been at the forefront of horological precision for over a century. They have been the Official Timekeeper of the Olympic Games since 1932 and pioneered
                        the revolutionary Co-Axial escapement in modern watchmaking.
                    </p>
                    <h6 className="font-medium text-shine">To the Moon and the Deep Sea</h6>
                    <p className="font-secondary">
                        Omega's historical significance is unmatched. The Speedmaster Professional famously became the first watch worn on the moon in 1969. Meanwhile, the Seamaster collection has been the watch of choice for deep-sea
                        explorers, military divers, and, famously, James Bond.
                    </p>
                </div>
            );

        case "panerai":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Florentine Roots and Naval History</h6>
                    <p className="font-secondary">
                        Founded in Florence, Italy in 1860 by Giovanni Panerai, the company started as a watch shop and school. Panerai eventually became the official supplier of precision instruments to the Royal Italian Navy, specializing
                        in highly legible, water-resistant watches for frogmen.
                    </p>
                    <h6 className="font-medium text-shine">Radiomir and Luminor</h6>
                    <p className="font-secondary">
                        Panerai is known for its oversized cushion cases and distinctive crown guards. The Radiomir (using a radium-based powder for luminosity) and later the Luminor (using a safer tritium-based compound) defined the
                        brand's rugged, tactical aesthetic that gained a massive civilian cult following in the 1990s.
                    </p>
                </div>
            );

        case "patek philippe":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Pinnacle of Haute Horlogerie</h6>
                    <p className="font-secondary">
                        Established in 1839 in Geneva by Antoine Norbert de Patek and François Czapek (later joined by Jean Adrien Philippe), Patek Philippe represents the zenith of traditional Swiss watchmaking. The family-owned
                        manufacture is considered one of the prestigious "Holy Trinity" of watch brands.
                    </p>
                    <h6 className="font-medium text-shine">Unrivaled Elegance and Complexity</h6>
                    <p className="font-secondary">
                        From the elegant Calatrava dress watch to the sporty Nautilus designed by Gérald Genta, Patek Philippe timepieces are highly coveted. The brand is renowned for creating some of the most complicated mechanical watches
                        in the world, embodying the motto: "You never actually own a Patek Philippe. You merely look after it for the next generation."
                    </p>
                </div>
            );

        case "piaget":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Masters of the Ultra-Thin</h6>
                    <p className="font-secondary">
                        Founded in 1874 by Georges Edouard Piaget in La Côte-aux-Fées, the company initially focused entirely on the design and manufacture of highly precise pocket watch movements for other prestigious brands before
                        registering its own name in 1943.
                    </p>
                    <h6 className="font-medium text-shine">The Altiplano Legacy</h6>
                    <p className="font-secondary">
                        Piaget is world-renowned for its mastery of ultra-thin watchmaking. In 1957, they introduced the legendary Calibre 9P, a hand-wound movement just 2mm thick, which paved the way for the Altiplano collection—a
                        benchmark for elegant, razor-thin dress watches.
                    </p>
                </div>
            );

        case "sinn":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Purpose-Built Tool Watches</h6>
                    <p className="font-secondary">
                        Founded in 1961 by flight instructor and pilot Helmut Sinn in Frankfurt, Germany, Sinn Spezialuhren began by manufacturing navigational clocks and pilot chronographs. The brand prioritizes ultimate functionality,
                        extreme durability, and exceptional legibility over decorative embellishments.
                    </p>
                    <h6 className="font-medium text-shine">Material Innovation</h6>
                    <p className="font-secondary">
                        Sinn is highly respected among professionals for pushing the boundaries of watch technology. They incorporate unique innovations such as cases made from German submarine steel, TEGIMENT scratch-resistance technology,
                        and Ar-Dehumidifying concepts to prevent crystal fogging in extreme environments.
                    </p>
                </div>
            );

        case "tag heuer":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">Motorsport Heritage</h6>
                    <p className="font-secondary">
                        Founded in 1860 by Edouard Heuer in St-Imier, Switzerland, the brand (originally just "Heuer") became heavily intertwined with competitive sports and automobile racing. Heuer patented the oscillating pinion in 1887,
                        a major advancement in mechanical chronographs.
                    </p>
                    <h6 className="font-medium text-shine">Carrera and Monaco</h6>
                    <p className="font-secondary">
                        TAG Heuer’s legacy is defined by its iconic racing chronographs. The Carrera, launched in 1963, provided clean, legible timekeeping for drivers. In 1969, the brand released the Monaco, instantly recognizable by its
                        square case and worn by Steve McQueen in the film "Le Mans."
                    </p>
                </div>
            );

        case "tudor":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The Shield of Rolex</h6>
                    <p className="font-secondary">
                        Tudor was established in 1926 by Hans Wilsdorf, the founder of Rolex. Wilsdorf's vision was to create a watch that offered the legendary dependability and waterproof characteristics of a Rolex but at a more
                        accessible price point, initially achieved by using off-the-shelf mechanical movements.
                    </p>
                    <h6 className="font-medium text-shine">Born to Dare</h6>
                    <p className="font-secondary">
                        Over the decades, Tudor developed its own distinct identity, equipping military dive units like the French Navy (Marine Nationale). Today, Tudor is celebrated for its vintage-inspired Black Bay and Pelagos
                        collections, now boasting high-performance in-house calibers.
                    </p>
                </div>
            );

        case "van cleef & arpels":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">High Jewelry and Romance</h6>
                    <p className="font-secondary">
                        Founded in 1896 by Alfred Van Cleef and his father-in-law Salomon Arpels in Paris, the Maison is fundamentally celebrated for its spectacular high jewelry. Their foray into watchmaking brings that same spirit of
                        enchantment, craftsmanship, and storytelling to the wrist.
                    </p>
                    <h6 className="font-medium text-shine">Poetic Complications</h6>
                    <p className="font-secondary">
                        Rather than focusing solely on traditional timekeeping precision, Van Cleef &amp; Arpels is famous for its "Poetic Complications." These watches utilize complex retrograde movements and mechanical automation to tell
                        time through moving fairies, planets, and lovers meeting on a bridge.
                    </p>
                </div>
            );
        case "zenith":
            return (
                <div className={wrapperClass}>
                    <h6 className="font-medium text-shine">The First Integrated Swiss Manufacture</h6>
                    <p className="font-secondary">
                        Founded in 1865 by Georges Favre-Jacot in Le Locle, Switzerland, Zenith revolutionized the industry by bringing all watchmaking professions under one roof. This visionary approach created one of the very first true
                        integrated watch manufactures in Swiss history, allowing for unprecedented quality control.
                    </p>
                    <h6 className="font-medium text-shine">The Legendary El Primero</h6>
                    <p className="font-secondary">
                        In 1969, Zenith changed horology forever by introducing the El Primero, widely regarded as the world's first automatic chronograph movement. Beating at a high frequency of 36,000 vibrations per hour, it allowed for
                        time measurement to the nearest 1/10th of a second and remains one of the most famous calibers ever made.
                    </p>
                </div>
            );
        default:
            return <div></div>;
    }
}
