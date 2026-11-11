import { useRef, useState } from "react";
import type { Hotspot, Project } from "../../types/project";
import { MediaInput } from "./MediaLibrary";
type Update = (fn: (p: Project) => Project) => Promise<void>;
export function VisualPlanEditor({
  project,
  update,
}: {
  project: Project;
  update: Update;
}) {
  const [selected, setSelected] = useState(project.typologies[0]?.id || "");
  const [zone, setZone] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [ghost, setGhost] = useState<Hotspot | null>(null);
  const gesture = useRef<{
    start: { x: number; y: number };
    original: Hotspot;
    mode: "draw" | "move" | "resize";
  } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const typology = project.typologies.find((t) => t.id === selected);
  const position = (e: React.PointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const begin = (
    e: React.PointerEvent,
    original: Hotspot,
    mode: "draw" | "move" | "resize",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { start: position(e), original, mode };
    setZone(original.id);
    setSelected(original.typologyId);
    setGhost(original);
  };
  const move = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const p = position(e),
      dx = p.x - g.start.x,
      dy = p.y - g.start.y;
    const next = { ...g.original };
    if (g.mode === "draw") {
      next.x = Math.min(p.x, g.start.x);
      next.y = Math.min(p.y, g.start.y);
      next.width = Math.abs(dx);
      next.height = Math.abs(dy);
    }
    if (g.mode === "move") {
      next.x = Math.max(0, Math.min(100 - next.width, g.original.x + dx));
      next.y = Math.max(0, Math.min(100 - next.height, g.original.y + dy));
    }
    if (g.mode === "resize") {
      next.width = Math.max(1, Math.min(100 - next.x, g.original.width + dx));
      next.height = Math.max(1, Math.min(100 - next.y, g.original.height + dy));
    }
    setGhost(next);
  };
  const finish = () => {
    if (ghost && gesture.current && ghost.width >= 1 && ghost.height >= 1) {
      const h = ghost,
        mode = gesture.current.mode;
      void update((p) => ({
        ...p,
        floorPlan: {
          ...p.floorPlan,
          hotspots:
            mode === "draw"
              ? [...p.floorPlan.hotspots, h]
              : p.floorPlan.hotspots.map((i) => (i.id === h.id ? h : i)),
        },
      }));
    }
    gesture.current = null;
    setGhost(null);
    setDrawing(false);
  };
  const patch = (data: object) =>
    update((p) => ({
      ...p,
      typologies: p.typologies.map((t) =>
        t.id === selected
          ? { ...t, ...data, updatedAt: new Date().toISOString() }
          : t,
      ),
    }));
  const zones = [
    ...project.floorPlan.hotspots.filter((h) => h.id !== ghost?.id),
    ...(ghost ? [ghost] : []),
  ];
  return (
    <div className="cms-plan-layout">
      <section className="cms-card">
        <h2>Planta típica</h2>
        <p>
          Selecciona una zona y arrástrala. Usa la esquina para cambiar su
          tamaño.
        </p>
        <div className="cms-actions">
          <button
            className={drawing ? "cms-primary" : ""}
            onClick={() => setDrawing(!drawing)}
            disabled={!typology}
          >
            {drawing
              ? "Dibuja un rectángulo sobre el plano"
              : "＋ Dibujar zona"}
          </button>
          <button
            disabled={!zone}
            onClick={() => {
              void update((p) => ({
                ...p,
                floorPlan: {
                  ...p.floorPlan,
                  hotspots: p.floorPlan.hotspots.filter((h) => h.id !== zone),
                },
              }));
              setZone(null);
            }}
          >
            Eliminar zona
          </button>
        </div>
        <div
          ref={frame}
          className={`cms-plan ${drawing ? "is-drawing" : ""}`}
          onPointerDown={(e) => {
            if (drawing && typology) {
              const p = position(e);
              begin(
                e,
                {
                  id: crypto.randomUUID(),
                  typologyId: selected,
                  ...p,
                  width: 0,
                  height: 0,
                },
                "draw",
              );
            }
          }}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={() => {
            gesture.current = null;
            setGhost(null);
          }}
        >
          <img
            src={project.floorPlan.imageSrc}
            alt={project.floorPlan.title}
            draggable={false}
          />
          {zones.map((h) => (
            <div
              key={h.id}
              role="button"
              tabIndex={0}
              aria-label={`Zona ${project.typologies.find((t) => t.id === h.typologyId)?.code || ""}`}
              className={`cms-zone ${h.id === zone ? "selected" : ""}`}
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.width}%`,
                height: `${h.height}%`,
              }}
              onPointerDown={(e) => {
                if (!drawing) begin(e, h, "move");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setZone(h.id);
                  setSelected(h.typologyId);
                }
              }}
            >
              {project.typologies.find((t) => t.id === h.typologyId)?.code}
              <span
                className="cms-resize"
                onPointerDown={(e) => {
                  if (!drawing) begin(e, h, "resize");
                }}
              />
            </div>
          ))}
        </div>
        {zone && (
          <label>
            Vincular zona a tipología
            <select
              className="field"
              value={
                project.floorPlan.hotspots.find((h) => h.id === zone)
                  ?.typologyId || selected
              }
              onChange={(e) => {
                const id = e.target.value;
                setSelected(id);
                void update((p) => ({
                  ...p,
                  floorPlan: {
                    ...p.floorPlan,
                    hotspots: p.floorPlan.hotspots.map((h) =>
                      h.id === zone ? { ...h, typologyId: id } : h,
                    ),
                  },
                }));
              }}
            >
              {project.typologies.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code}
                </option>
              ))}
            </select>
          </label>
        )}
        <details>
          <summary>Reemplazar planta típica</summary>
          <MediaInput
            preserve
            removeLabel={false}
            src={project.floorPlan.imageSrc}
            recommendation="3000 × 2000 px o superior · conservar márgenes y proporción"
            onChange={(imageSrc) => {
              if (imageSrc)
                void update((p) => ({
                  ...p,
                  floorPlan: {
                    ...p.floorPlan,
                    imageSrc,
                    updatedAt: new Date().toISOString(),
                  },
                  typologies: p.typologies.map((t) => ({
                    ...t,
                    floorThumbnailSrc: imageSrc,
                  })),
                }));
            }}
          />
        </details>
      </section>
      <aside className="cms-card">
        <h2>Propiedades del departamento</h2>
        <label>
          Tipología
          <select
            className="field"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setZone(null);
            }}
          >
            {project.typologies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code}
              </option>
            ))}
          </select>
        </label>
        {typology && (
          <>
            <label>
              Código
              <input
                className="field"
                value={typology.code}
                onChange={(e) => void patch({ code: e.target.value })}
              />
            </label>
            <label>
              Formato
              <select
                className="field"
                value={typology.format}
                onChange={(e) => void patch({ format: e.target.value })}
              >
                {[
                  "Flat",
                  "Duplex",
                  "Penthouse",
                  "Garden home",
                  "Demostrativo",
                ].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            {(["areaM2", "bedrooms", "bathrooms"] as const).map((key, i) => (
              <label key={key}>
                {["Metraje (m²)", "Dormitorios", "Baños"][i]}
                <input
                  className="field"
                  type="number"
                  min="0"
                  step={key === "areaM2" ? "0.01" : "1"}
                  value={typology[key] ?? ""}
                  onChange={(e) =>
                    void patch({ [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
            <label>
              <input
                type="checkbox"
                checked={typology.active}
                onChange={(e) => void patch({ active: e.target.checked })}
              />{" "}
              Visible
            </label>
            <MediaInput
              preserve
              removeLabel={false}
              src={typology.planSrc}
              recommendation="3000 × 2200 px o superior · plano original sin compresión"
              onChange={(src) =>
                void patch({ planSrc: src, thumbnailSrc: src })
              }
            />
            <label>
              Notas
              <textarea
                className="field"
                value={typology.notes || ""}
                onChange={(e) => void patch({ notes: e.target.value })}
              />
            </label>
            <details>
              <summary>Más propiedades</summary>
              {(["terrace", "study", "walkInCloset"] as const).map((key, i) => (
                <label className="cms-check" key={key}>
                  <input
                    type="checkbox"
                    checked={!!typology.features[key]}
                    onChange={(e) =>
                      void patch({
                        features: {
                          ...typology.features,
                          [key]: e.target.checked,
                        },
                      })
                    }
                  />
                  {["Terraza", "Estudio", "Walk-in closet"][i]}
                </label>
              ))}
              <label>
                Departamentos (uno por línea)
                <textarea
                  className="field"
                  value={typology.apartments.map((a) => a.label).join("\n")}
                  onChange={(e) =>
                    void patch({
                      apartments: e.target.value
                        .split("\n")
                        .map((label, i) => ({
                          id: typology.apartments[i]?.id || crypto.randomUUID(),
                          label,
                        })),
                    })
                  }
                />
              </label>
              {typology.rooms.map((room) => (
                <label key={room.id}>
                  Ambiente
                  <input
                    className="field"
                    value={room.name}
                    onChange={(e) =>
                      void patch({
                        rooms: typology.rooms.map((r) =>
                          r.id === room.id ? { ...r, name: e.target.value } : r,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label="Dimensiones del ambiente"
                    className="field"
                    value={room.dimensions || ""}
                    onChange={(e) =>
                      void patch({
                        rooms: typology.rooms.map((r) =>
                          r.id === room.id
                            ? { ...r, dimensions: e.target.value }
                            : r,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </details>
          </>
        )}
      </aside>
    </div>
  );
}
