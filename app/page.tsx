import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProcessJourney from "@/components/process/ProcessJourney";
import Products from "@/components/Products";
import WhyBelarus from "@/components/WhyBelarus";
import Quality from "@/components/Quality";
import Sustainability from "@/components/Sustainability";
import GlobalExport from "@/components/GlobalExport";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { products } from "@/lib/products";

/** Product structured data for rich results. */
const productSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Belalak Milk Powder Products",
  itemListElement: products.map((product, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Product",
      name: `Belalak ${product.name}`,
      description: product.description,
      brand: { "@type": "Brand", name: "Belalak Milk" },
      countryOfOrigin: "Belarus",
      category: "Dairy Ingredients",
      url: `https://belalak.com/#products`,
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
      <Navbar />
      <main>
        <Hero />
        <ProcessJourney />
        <Products />
        <WhyBelarus />
        <Quality />
        <Sustainability />
        <GlobalExport />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
