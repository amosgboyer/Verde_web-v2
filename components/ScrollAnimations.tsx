"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Fade in up — cualquier elemento con clase .gsap-fade-up
    gsap.utils.toArray<Element>(".gsap-fade-up").forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true }
        }
      );
    });

    // Stagger children — cualquier elemento con clase .gsap-stagger
    gsap.utils.toArray<Element>(".gsap-stagger").forEach((el) => {
      gsap.fromTo(el.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 80%", once: true }
        }
      );
    });

    // Cuando el formulario colapsa/expande pasos, cambia el alto de la página y
    // las posiciones de ScrollTrigger quedan obsoletas (las reseñas se quedaban
    // ocultas en móvil). Recalcular al recibir el evento de cambio de layout.
    const onLayoutChange = () => ScrollTrigger.refresh();
    window.addEventListener("verde:layout:changed", onLayoutChange);

    return () => {
      window.removeEventListener("verde:layout:changed", onLayoutChange);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
