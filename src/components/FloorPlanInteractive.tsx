import { Move, Maximize2 } from "lucide-react";
import type { FloorPlan, Hotspot, Typology } from "../types/project";

interface Props {
  floorPlan: FloorPlan;
  typologies: Typology[];
  selectedId?: string;
  editable?: boolean;
  onSelect: (typologyId: string) => void;
  onHotspotChange?: (hotspot: Hotspot) => void;
}

export function FloorPlanInteractive({ floorPlan, typologies, selectedId, editable, onSelect, onHotspotChange }: Props) {
  const byId = new Map(typologies.map((typology) => [typology.id, typology]));

  function update(hotspot: Hotspot, patch: Partial<Hotspot>) {
    onHotspotChange?.({
      ...hotspot,
      ...patch,
      x: clamp(patch.x ?? hotspot.x),
      y: clamp(patch.y ?? hotspot.y),
      width: clamp(patch.width ?? hotspot.width, 4, 60),
      height: clamp(patch.height ?? hotspot.height, 4, 60)
    });
  }

  return (
    <div className="relative overflow-hidden rounded border border-ink/10 bg-white">
      <img className="block w-full select-none" src={floorPlan.imageSrc} alt={floorPlan.title} draggable={false} />
      {floorPlan.hotspots.map((hotspot) => {
        const typology = byId.get(hotspot.typologyId);
        const active = selectedId === hotspot.typologyId;
        if (!typology) return null;
        return (
          <button
            key={hotspot.id}
            className={`absolute min-h-11 border-2 text-xs font-bold transition ${
              active ? "border-morada bg-morada/30 text-white ring-4 ring-morada/25" : "border-morada/60 bg-morada/10 text-morada hover:bg-morada/20"
            } ${selectedId && !active ? "opacity-35" : "opacity-100"}`}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }}
            onClick={() => onSelect(hotspot.typologyId)}
            type="button"
          >
            {typology.code}
            {editable ? (
              <span className="absolute -bottom-9 left-0 flex gap-1 rounded-full bg-ink px-2 py-1 text-white">
                <Move className="size-3" />
                <Maximize2 className="size-3" />
              </span>
            ) : null}
          </button>
        );
      })}
      {editable ? (
        <div className="grid gap-3 border-t border-ink/10 bg-paper p-4 md:grid-cols-2 xl:grid-cols-4">
          {floorPlan.hotspots.map((hotspot) => {
            const typology = byId.get(hotspot.typologyId);
            return (
              <div key={hotspot.id} className="rounded border border-ink/10 bg-white p-3">
                <p className="mb-2 font-semibold">{typology?.code}</p>
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label className="mb-2 grid grid-cols-[56px_1fr_42px] items-center gap-2 text-xs" key={field}>
                    <span>{field}</span>
                    <input type="range" min="0" max="100" value={hotspot[field]} onChange={(event) => update(hotspot, { [field]: Number(event.target.value) })} />
                    <span>{Math.round(hotspot[field])}%</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}
