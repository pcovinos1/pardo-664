import { useState } from "react";
import type { FloorPlan, Typology } from "../types/project";

interface Props {
  floorPlan: FloorPlan;
  typologies: Typology[];
  selectedId?: string;
  onSelect: (typologyId: string) => void;
}

export function FloorPlanInteractive({ floorPlan, typologies, selectedId, onSelect }: Props) {
  const byId = new Map(typologies.filter((typology) => typology.active).map((typology) => [typology.id, typology]));
  const [imageRatio, setImageRatio] = useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded border border-ink/10 bg-white">
      <div className="relative mx-auto w-full" style={imageRatio ? { aspectRatio: `${imageRatio}` } : undefined}>
        <img
          className="absolute inset-0 h-full w-full select-none object-contain"
          src={floorPlan.imageSrc}
          alt={floorPlan.title}
          draggable={false}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) setImageRatio(image.naturalWidth / image.naturalHeight);
          }}
        />
        {floorPlan.hotspots.map((hotspot) => {
          const typology = byId.get(hotspot.typologyId);
          if (!typology) return null;
          return (
            <button
              key={hotspot.id}
              className={`absolute border-0 bg-transparent text-transparent outline-none transition ${selectedId === hotspot.typologyId ? "ring-4 ring-morada/80 ring-offset-2 ring-offset-transparent" : ""}`}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }}
              onClick={() => onSelect(hotspot.typologyId)}
              type="button"
              aria-label={`Seleccionar tipología ${typology.code}`}
            />
          );
        })}
      </div>
    </div>
  );
}
