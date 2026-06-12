import SectionHeading from "@/components/ui/SectionHeading";
import StageCollection from "./StageCollection";
import StageTesting from "./StageTesting";
import StagePasteurization from "./StagePasteurization";
import StageConcentration from "./StageConcentration";
import StageSprayDrying from "./StageSprayDrying";
import StageFinalProduct from "./StageFinalProduct";

/**
 * The signature scroll experience: six pinned, scrub-animated stages
 * telling the story of how fresh Belarusian milk becomes premium powder.
 */
export default function ProcessJourney() {
  return (
    <div id="process">
      {/* chapter intro */}
      <section className="bg-milk py-28 sm:py-36">
        <div className="container-site">
          <SectionHeading
            kicker="The Signature Journey"
            title="How milk becomes milk powder"
            lede="Scroll through every step of our production story — from the farms of Belarus to the sealed bag — told through six cinematic stages."
          />
        </div>
      </section>

      <StageCollection />
      <StageTesting />
      <StagePasteurization />
      <StageConcentration />
      <StageSprayDrying />
      <StageFinalProduct />
    </div>
  );
}
