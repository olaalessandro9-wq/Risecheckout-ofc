import { BuilderComponentConfig } from "./types";
// Importaremos os componentes aqui conforme formos migrando
import { TextConfig } from "./items/Text";
import { ImageConfig } from "./items/Image";
import { TimerConfig } from "./items/Timer";
import { VideoConfig } from "./items/Video";
import { TestimonialConfig } from "./items/Testimonial";
import { OrderBumpConfig } from "./items/OrderBump";
import { AdvantageConfig } from "./items/Advantage";
import { SealConfig } from "./items/Seal";

/**
 * Registro central de todos os componentes disponíveis no builder
 * Cada chave é o 'type' do componente, e o valor é sua configuração completa
 */
export const ComponentRegistry: Record<string, BuilderComponentConfig> = {
  text: TextConfig,
  image: ImageConfig,
  timer: TimerConfig,
  video: VideoConfig,
  testimonial: TestimonialConfig,
  orderbump: OrderBumpConfig,
  advantage: AdvantageConfig,
  seal: SealConfig,
};

/**
 * Busca a configuração de um componente pelo tipo
 * @param type - O tipo do componente (ex: 'text', 'image')
 * @returns A configuração do componente ou null se não encontrado
 */
export const getComponentConfig = (type: string): BuilderComponentConfig | null => {
  return ComponentRegistry[type] || null;
};
