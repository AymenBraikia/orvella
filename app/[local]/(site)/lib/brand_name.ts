/** Brands whose official spelling is not plain title case. Keys are lowercase. */
const SPECIAL: Record<string, string> = {
    iwc: "IWC",
    "tag heuer": "TAG Heuer",
    "jaeger-lecoultre": "Jaeger-LeCoultre",
    "jaeger lecoultre": "Jaeger-LeCoultre",
    nomos: "NOMOS",
    "nomos glashütte": "NOMOS Glashütte",
    "a. lange & söhne": "A. Lange & Söhne",
    "a. lange & sohne": "A. Lange & Söhne",
    "van cleef & arpels": "Van Cleef & Arpels",
    "f.p. journe": "F.P. Journe",
    "h. moser & cie.": "H. Moser & Cie.",
    "mb&f": "MB&F",
    "de bethune": "De Bethune",
    "girard perregaux": "Girard-Perregaux",
    "girard-perregaux": "Girard-Perregaux",
    "frank muller": "Franck Muller",
    "franck muller": "Franck Muller",
    bvlgari: "Bvlgari",
    "glashütte original": "Glashütte Original",
    "mühle-glashütte": "Mühle-Glashütte",
};

/**
 * How a brand is shown. The catalogue often stores brands in lowercase ("rolex"); this gives
 * "Rolex", "IWC", "TAG Heuer"… without touching the data.
 */
export function brand_name(brand: string | undefined): string {
    if (!brand) return "";
    const key = brand.trim().toLowerCase();
    if (SPECIAL[key]) return SPECIAL[key];

    // Words already written with capitals (e.g. "McGonigle") are kept as entered.
    return brand.trim().replace(/[^\s-]+/g, (word) => (word === word.toLowerCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word));
}
