import { useState } from "react";
import type { AboutContent, Project } from "../../types/project";
import { MediaInput } from "./MediaLibrary";
export function AboutEditor({
  project,
  update,
}: {
  project: Project;
  update: (fn: (p: Project) => Project) => Promise<void>;
}) {
  const [tab, setTab] = useState("cover");
  const a = project.about;
  const change = (fn: (a: AboutContent) => AboutContent) =>
    void update((p) => ({ ...p, about: fn(p.about) }));
  return (
    <>
      <div className="cms-actions">
        {[
          ["cover", "Portada"],
          ["slides", "Bloques y reconocimientos"],
          ["projects", "Proyectos de Morada"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "cms-primary" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "cover" && (
        <section className="cms-card">
          <h2>Portada institucional</h2>
          {(["eyebrow", "title", "subtitle"] as const).map((key, i) => (
            <label key={key}>
              {["Antetítulo", "Título", "Subtítulo"][i]}
              <input
                className="field"
                value={a[key]}
                onChange={(e) =>
                  change((p) => ({ ...p, [key]: e.target.value }))
                }
              />
            </label>
          ))}
          <MediaInput
            src={a.coverImageSrc}
            onChange={(coverImageSrc) =>
              change((p) => ({ ...p, coverImageSrc }))
            }
          />
        </section>
      )}
      {tab === "slides" && (
        <section className="cms-card">
          <h2>Historia, logos y reconocimientos</h2>
          <button
            onClick={() =>
              change((p) => ({
                ...p,
                slides: [
                  ...p.slides,
                  {
                    id: crypto.randomUUID(),
                    number: String(p.slides.length + 1).padStart(2, "0"),
                    text: "",
                    keywords: [],
                  },
                ],
              }))
            }
          >
            ＋ Agregar bloque
          </button>
          {a.slides.map((s) => {
            const patch = (patch: Partial<typeof s>) =>
              change((p) => ({
                ...p,
                slides: p.slides.map((i) =>
                  i.id === s.id ? { ...i, ...patch } : i,
                ),
              }));
            return (
              <details key={s.id}>
                <summary>
                  {s.number} · {s.text.slice(0, 55) || "Nuevo bloque"}
                </summary>
                <label>
                  Número
                  <input
                    className="field"
                    value={s.number}
                    onChange={(e) => patch({ number: e.target.value })}
                  />
                </label>
                <label>
                  Texto institucional
                  <textarea
                    className="field"
                    value={s.text}
                    onChange={(e) => patch({ text: e.target.value })}
                  />
                </label>
                <label>
                  Frases destacadas (una por línea)
                  <textarea
                    className="field"
                    value={s.keywords.join("\n")}
                    onChange={(e) =>
                      patch({ keywords: e.target.value.split("\n") })
                    }
                  />
                </label>
                <MediaInput
                  src={s.imageSrc}
                  onChange={(imageSrc) => patch({ imageSrc })}
                />
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar bloque?"))
                      change((p) => ({
                        ...p,
                        slides: p.slides.filter((i) => i.id !== s.id),
                      }));
                  }}
                >
                  Eliminar bloque
                </button>
              </details>
            );
          })}
        </section>
      )}
      {tab === "projects" && (
        <section className="cms-card">
          <h2>Portafolio de Morada</h2>
          <button
            onClick={() =>
              change((p) => ({
                ...p,
                projects: [
                  ...p.projects,
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    year: "",
                    district: "",
                    imageSrc: "",
                    order: p.projects.length + 1,
                  },
                ],
              }))
            }
          >
            ＋ Agregar proyecto
          </button>
          {[...a.projects]
            .sort((x, y) => x.order - y.order)
            .map((s) => {
              const patch = (patch: Partial<typeof s>) =>
                change((p) => ({
                  ...p,
                  projects: p.projects.map((i) =>
                    i.id === s.id ? { ...i, ...patch } : i,
                  ),
                }));
              return (
                <details key={s.id}>
                  <summary>{s.name || "Nuevo proyecto"}</summary>
                  <MediaInput
                    src={s.imageSrc}
                    onChange={(imageSrc) => patch({ imageSrc })}
                  />
                  <div className="cms-fields">
                    {(["name", "year", "district", "architect"] as const).map(
                      (key, i) => (
                        <label key={key}>
                          {["Nombre", "Año", "Distrito", "Arquitectos"][i]}
                          <input
                            className="field"
                            value={s[key] || ""}
                            onChange={(e) => patch({ [key]: e.target.value })}
                          />
                        </label>
                      ),
                    )}
                    <label>
                      Orden
                      <input
                        type="number"
                        className="field"
                        value={s.order}
                        onChange={(e) =>
                          patch({ order: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar proyecto del portafolio?"))
                        change((p) => ({
                          ...p,
                          projects: p.projects.filter((i) => i.id !== s.id),
                        }));
                    }}
                  >
                    Eliminar proyecto
                  </button>
                </details>
              );
            })}
        </section>
      )}
    </>
  );
}
