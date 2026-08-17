import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin,
  SplitText,
  Flip,
  Draggable,
  InertiaPlugin,
  DrawSVGPlugin,
  CustomEase
);

CustomEase.create("house", "0.32, 0, 0.12, 1");

export { Draggable, Flip, gsap, ScrollTrigger, SplitText };
