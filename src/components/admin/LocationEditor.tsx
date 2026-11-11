import { getNeighborhood } from "../../data/locationContent";
import { useRef, useState } from "react";
import type { PointOfInterest, Project } from "../../types/project";
import { ImageLibrary, MediaInput } from "./MediaLibrary";
export function LocationEditor({
  project,
  update,
}: {
  project: Project;
  update: (fn: (p: Project) => Project) => Promise<void>;
}) {
  const [selected, setSelected] = useState(
    project.pointsOfInterest[0]?.id || "",
  );
  const [block, setBlock] = useState("story");
  const dragging = useRef<string | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const gallery = project.galleries.find((g) => g.id === "barrio");
  const poi = project.pointsOfInterest.find((p) => p.id === selected);
  const { story, mapCopy, position } = getNeighborhood(project);
  const patch = (data: Partial<PointOfInterest>) =>
    update((p) => ({
      ...p,
      pointsOfInterest: p.pointsOfInterest.map((i) =>
        i.id === selected ? { ...i, ...data } : i,
      ),
    }));
  const place = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const r = frame.current!.getBoundingClientRect();
    const id = dragging.current;
    const pos = {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
    void update((p) =>
      id === "project"
        ? { ...p, mapProjectPosition: pos }
        : {
            ...p,
            pointsOfInterest: p.pointsOfInterest.map((i) =>
              i.id === id ? { ...i, ...pos } : i,
            ),
          },
    );
  };
  return (
    <>
      <div className="cms-actions">
        <button
          className={block === "story" ? "cms-primary" : ""}
          aria-pressed={block === "story"}
          onClick={() => setBlock("story")}
        >
          Fotografías del barrio
        </button>
        <button
          className={block === "map" ? "cms-primary" : ""}
          aria-pressed={block === "map"}
          onClick={() => setBlock("map")}
        >
          Mapa del entorno
        </button>
      </div>
      {block === "story" ? (
        <section className="cms-card">
          <h2>Fotografías del barrio</h2>
          <label>
            Título
            <input
              className="field"
              value={story.title}
              onChange={(e) =>
                void update((p) => ({
                  ...p,
                  locationStory: { ...story, title: e.target.value },
                }))
              }
            />
          </label>
          <label>
            Descripción
            <textarea
              className="field"
              value={story.description}
              onChange={(e) =>
                void update((p) => ({
                  ...p,
                  locationStory: { ...story, description: e.target.value },
                }))
              }
            />
          </label>
          <ImageLibrary
            category="barrio"
            complementary={false}
            images={story.images}
            onChange={(images) =>
              void update((p) => ({
                ...p,
                locationStory: { ...story, images },
              }))
            }
          />
        </section>
      ) : (
        <div className="cms-plan-layout">
          <section className="cms-card">
            <h2>Mapa del entorno</h2>
            <label>
              Título
              <input
                className="field"
                value={mapCopy.title}
                onChange={(event) => {
                  const title = event.target.value;
                  void update((p) => ({
                    ...p,
                    locationMapCopy: { ...mapCopy, title },
                  }));
                }}
              />
            </label>
            <label>
              Descripción
              <textarea
                className="field"
                value={mapCopy.description}
                onChange={(event) => {
                  const description = event.target.value;
                  void update((p) => ({
                    ...p,
                    locationMapCopy: { ...mapCopy, description },
                  }));
                }}
              />
            </label>
            <label>
              Dirección del proyecto
              <input
                className="field"
                value={project.address}
                onChange={(event) => {
                  const address = event.target.value;
                  void update((p) => ({ ...p, address }));
                }}
              />
            </label>
            <p>
              Selecciona un lugar y toca el mapa para ubicarlo, o arrastra su
              marcador. El mapa queda disponible offline.
            </p>
            <div
              ref={frame}
              className="cms-plan"
              onPointerDown={(e) => {
                if (!poi && selected !== "project") return;
                dragging.current = selected;
                e.currentTarget.setPointerCapture(e.pointerId);
                place(e);
              }}
              onPointerMove={place}
              onPointerUp={() => (dragging.current = null)}
              onPointerCancel={() => (dragging.current = null)}
            >
              <img
                src={gallery?.images[0]?.src}
                alt="Mapa del distrito"
                draggable={false}
              />
              {
                <button
                  className="cms-map-marker selected"
                  title="Pardo 664"
                  onClick={() => setSelected("project")}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelected("project");
                    dragging.current = "project";
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                >
                  P
                </button>
              }
              {project.pointsOfInterest.map((p) => (
                <button
                  key={p.id}
                  className={`cms-map-marker ${selected === p.id ? "selected" : ""}`}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    opacity: p.visible ? 1 : 0.4,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelected(p.id);
                    dragging.current = p.id;
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  title={p.name}
                  onClick={() => setSelected(p.id)}
                >
                  {p.order}
                </button>
              ))}
            </div>
            <details>
              <summary>Reemplazar mapa offline</summary>
              <MediaInput
                preserve
                removeLabel={false}
                src={gallery?.images[0]?.src}
                onChange={(src) => {
                  if (src)
                    void update((p) => ({
                      ...p,
                      galleries: p.galleries.map((g) =>
                        g.id === "barrio"
                          ? {
                              ...g,
                              images: [
                                { ...g.images[0], src },
                                ...g.images.slice(1),
                              ],
                            }
                          : g,
                      ),
                    }));
                }}
              />
            </details>
          </section>
          <aside className="cms-card">
            <div className="cms-actions">
              <button onClick={() => setSelected("project")}>
                Ubicar Pardo 664
              </button>
              {project.mapProjectPosition && (
                <button
                  onClick={() =>
                    void update((p) => ({
                      ...p,
                      mapProjectPosition: undefined,
                    }))
                  }
                >
                  Restaurar ubicación del proyecto
                </button>
              )}
            </div>
            {selected === "project" && (
              <p>Toca el mapa para colocar el marcador del proyecto.</p>
            )}
            <button
              onClick={() => {
                const id = crypto.randomUUID();
                setSelected(id);
                void update((p) => ({
                  ...p,
                  pointsOfInterest: [
                    ...p.pointsOfInterest,
                    {
                      id,
                      name: "Nuevo lugar",
                      category: "Parques",
                      x: 50,
                      y: 50,
                      order: p.pointsOfInterest.length + 1,
                      visible: true,
                    },
                  ],
                }));
              }}
            >
              ＋ Agregar lugar
            </button>
            <label>
              Lugar
              <select
                className="field"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {selected === "project" && (
                  <option value="project">Pardo 664</option>
                )}
                {project.pointsOfInterest.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {poi && (
              <>
                <label>
                  Nombre
                  <input
                    className="field"
                    value={poi.name}
                    onChange={(e) => void patch({ name: e.target.value })}
                  />
                </label>
                <label>
                  Categoría
                  <select
                    className="field"
                    value={poi.category}
                    onChange={(e) =>
                      void patch({
                        category: e.target.value as PointOfInterest["category"],
                      })
                    }
                  >
                    {[
                      "Gastronomía",
                      "Parques",
                      "Educación",
                      "Tiendas",
                      "Entretenimiento",
                      "Cultura",
                      "Servicios",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Descripción
                  <textarea
                    className="field"
                    value={poi.description || ""}
                    onChange={(e) =>
                      void patch({ description: e.target.value })
                    }
                  />
                </label>
                <label>
                  Orden
                  <input
                    className="field"
                    type="number"
                    min="1"
                    value={poi.order}
                    onChange={(e) =>
                      void patch({ order: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={poi.visible}
                    onChange={(e) => void patch({ visible: e.target.checked })}
                  />{" "}
                  Mostrar
                </label>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar lugar?"))
                      void update((p) => ({
                        ...p,
                        pointsOfInterest: p.pointsOfInterest.filter(
                          (i) => i.id !== selected,
                        ),
                      }));
                  }}
                >
                  Eliminar lugar
                </button>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
