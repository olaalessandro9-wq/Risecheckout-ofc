/**
 * Cadastro Motion Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - Module-scope animation configs
 * 
 * Constantes estáveis para Framer Motion que NUNCA são recriadas,
 * garantindo que re-renders não causem reinício de animações.
 */

import type { Variants, Transition } from "framer-motion";

/**
 * Transition padrão para animações de fade
 */
export const fadeTransition: Transition = {
  duration: 0.3,
  ease: "easeOut",
};

/**
 * Transition com delay para elementos secundários
 */
export const delayedFadeTransition: Transition = {
  duration: 0.3,
  ease: "easeOut",
  delay: 0.2,
};

/**
 * Variants para views do quiz (entrada/saída com fade + slide)
 */
export const viewVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: fadeTransition,
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: fadeTransition,
  },
};

/**
 * Variants para elementos do branding panel (lado direito)
 */
export const brandingVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: delayedFadeTransition,
  },
};
