import { PixelLibrary } from "@/components/pixels";

const Pixels = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">
          Pixels de Rastreamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre e gerencie seus pixels para rastreamento de conversões
        </p>
      </div>

      <PixelLibrary />
    </div>
  );
};

export default Pixels;
