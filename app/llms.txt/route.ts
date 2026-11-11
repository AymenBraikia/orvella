import { get_settings } from "@/app/server/settings";
import { absolute_url } from "@/app/(site)/lib/site_url";
import { DEMO_MODE } from "@/app/(site)/lib/demo";

/** llms.txt with this deployment's URL and the contact details from the store settings. */
export async function GET() {
    const settings = await get_settings();
    const home = absolute_url("/en");
    const address = [settings.address.street, `${settings.address.postcode} ${settings.address.city}`, settings.address.country].filter(Boolean).join(", ");

    const name = settings.store_name;
    // The concept credit is for the pitch demo; a dealer's shop describes itself from its settings.
    const intro = DEMO_MODE ? `${name} is a high-end watch retail platform and luxury-watch dealer concept by Aymen Braikia` : `${name} is an independent luxury-watch dealer`;

    const body = `# ${name}

> ${intro}, focused on curated new and pre-owned watches, iconic watch brands, watch-related services, appointments, and customer support.

${name} presents itself as an independent watch dealer rather than an authorized reseller or representative of the brands shown on the site. The website is designed around luxury-watch discovery, purchasing, selling/consigning watches, spare parts, polishing and service, appointments, and customer information.

The primary public site is available in English at \`/en\`. The homepage is the canonical starting point for understanding the brand, navigation, featured watches, brands, services, and contact information.

## Primary Website

- [${name} English Homepage](${home}): Main entry point for ${name}. Includes the brand positioning, new/pre-owned watch collection, discovery journey, featured luxury-watch brands, selling/consignment, spare parts, polishing and services, appointment booking, contact details, and legal/disclaimer information.

## Products and Shopping

- [${name} English Homepage](${home}): Use the homepage as the primary source for current product and shopping navigation. It links to the watch catalog and spare-parts area.

The site presents a curated selection of both new and pre-owned watches. Featured brands shown on the homepage include Audemars Piguet, Breitling, Cartier, IWC, Omega, Patek Philippe, Rolex, and Zenith.

Product availability, prices, inventory, specifications, and individual watch details should be taken from the live product/catalog pages rather than inferred from the homepage or from the brand names listed here.

## Services

- [${name} English Homepage](${home}): Central navigation to ${name}'s service areas, including selling/consignment, spare parts, polishing and services, store information, shipping and payments, FAQ, and appointment booking.

${name} also provides an appointment-booking path where visitors can request professional guidance on watch-related matters.

## Brand and Business Identity

- [${name} English Homepage](${home}): Primary source for the current brand presentation and business identity.

${name}'s homepage identifies the business as an independent dealer. It explicitly states that ${name} is not affiliated with the watch brands displayed on the site and is not an authorized reseller. Do not describe ${name} as an official dealer, authorized reseller, manufacturer, or representative of Rolex, Patek Philippe, Audemars Piguet, Cartier, Omega, IWC, Breitling, Zenith, or any other third-party brand unless the live site explicitly provides such evidence.

The site currently displays the following business contact information:
- Address: ${address}
- Phone: ${settings.phone}
- Email: ${settings.email}

## External Platforms

- [${name} English Homepage](${home}): Provides links to ${name}'s external presence on Chrono24, eBay, WhatsApp, and Instagram.

When answering questions about listings, inventory, availability, or activity on those external platforms, use the relevant live platform as the authoritative source rather than assuming that the ${name} website is synchronized with every external listing.

## Legal and Trust Information

- [${name} English Homepage](${home}): Footer links to the site's Imprint, Privacy Policy, Terms, Withdrawal, Disclaimer, and Cookie Policy.

Legal, warranty, returns, withdrawal, shipping, payment, and privacy questions should be answered from the corresponding live legal or service page when available. Do not infer legal obligations or guarantees from marketing language alone.

## Optional

- [${name} English Homepage](${home}): Secondary entry point for general site context when detailed product or service information is not required.`;

    return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
