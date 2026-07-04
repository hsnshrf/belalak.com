import Stage01Farm from "./Stage01Farm";
import Stage02Transport from "./Stage02Transport";
import Stage03Testing from "./Stage03Testing";
import Stage04Pasteurization from "./Stage04Pasteurization";
import Stage05Separation from "./Stage05Separation";
import Stage06Evaporation from "./Stage06Evaporation";
import Stage07Instantizing from "./Stage07Instantizing";
import Stage08SprayDrying from "./Stage08SprayDrying";
import Stage09Product from "./Stage09Product";
import StreamConnector from "./StreamConnector";

/**
 * The nine-stage production journey. Every stage is a pinned, scrubbed
 * scene; between stages the StreamConnector carries the milk downward and
 * visibly changes state, so the whole page reads as ONE production line.
 */
export default function Journey() {
  return (
    <div id="journey">
      {/* chapter intro */}
      <section aria-label="About the journey" className="bg-milk py-20 sm:py-28">
        <div className="container-site max-w-3xl">
          <p className="kicker">The production line</p>
          <h2 className="stage-title mt-3">
            How milk becomes milk powder
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-steel">
            Nine stages, from a Belarusian milking parlor to a sealed 25 kg
            bag. Two of the decisions along the way are yours — they change
            the line, the visuals and the product you end up with.
          </p>
          <p className="readout mt-4">
            09 STAGES · 02 DECISIONS · 01 CONTINUOUS MILK STREAM
          </p>
        </div>
      </section>

      <Stage01Farm />
      <StreamConnector variant="chilled" />
      <Stage02Transport />
      <StreamConnector variant="arrival" />
      <Stage03Testing />
      <StreamConnector variant="accepted" />
      <Stage04Pasteurization />
      <StreamConnector variant="pasteurized" />
      <Stage05Separation />
      <StreamConnector variant="fat" />
      <Stage06Evaporation />
      <StreamConnector variant="concentrate" />
      <Stage07Instantizing />
      <StreamConnector variant="toDryer" />
      <Stage08SprayDrying />
      <StreamConnector variant="powder" />
      <Stage09Product />
    </div>
  );
}
