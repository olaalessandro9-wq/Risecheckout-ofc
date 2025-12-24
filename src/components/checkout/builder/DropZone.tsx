import { useDroppable } from "@dnd-kit/core";

interface DropZoneProps {
  id: string;
  children: React.ReactNode;
  isOver?: boolean;
}

export const DropZone = ({ id, children, isOver }: DropZoneProps) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] rounded-lg border-2 border-dashed transition-all ${
        isOver ? "border-primary bg-primary/10" : "border-muted-foreground/30"
      }`}
    >
      {children}
    </div>
  );
};
