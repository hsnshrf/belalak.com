import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Announcer from "@/components/journey/Announcer";
import Journey from "@/components/journey/Journey";
import LineSetupChip from "@/components/journey/LineSetupChip";
import ProductsGrid from "@/components/ProductsGrid";
import WhyBelarus from "@/components/WhyBelarus";
import { VARIANT_LIST } from "@/lib/variants";

/** Product structured data for rich results. */
const productSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Belalak Milk Powder Products",
  itemListElement: VARIANT_LIST.map((variant, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Product",
      name: `Belalak ${variant.name}`,
      description: variant.description,
      brand: { "@type": "Brand", name: "Belalak" },
      countryOfOrigin: "Belarus",
      category: "Dairy Ingredients",
      url: "https://belalak.com/#products",
    },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Header />
      <main>
        <Hero />
        <Journey />
        <WhyBelarus />
        <ProductsGrid />
        <Contact />
      </main>
      <Footer />
      {/* journey helpers: SR announcements + floating change-my-choice chip */}
      <Announcer />
      <LineSetupChip />
    </>
  );
}
