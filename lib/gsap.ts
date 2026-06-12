import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Plugins may only be registered in the browser — this module is imported
// by client components that also render on the server.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
