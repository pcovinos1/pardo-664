import { amenityName, sameAmenity } from "../../data/amenityNames";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  Building2,
  MapPin,
  Images,
  LayoutGrid,
  Settings,
  Users,
  DoorOpen,
  ArrowLeft,
  Eye,
  Save,
} from "lucide-react";
import { AboutEditor } from "./AboutEditor";
import type { Project } from "../../types/project";
import {
  backupProject,
  getBackup,
  normalizeProject,
  resetProject,
} from "../../services/db";
import {
  bumpVersion,
  exportProjectJson,
  exportProjectZip,
  importProjectZip,
} from "../../services/files";
import { ImageLibrary, MediaInput } from "./MediaLibrary";
import { VisualPlanEditor } from "./VisualPlanEditor";
import { LocationEditor } from "./LocationEditor";
import "./admin.css";
const tabs = [
  ["home", "Inicio", Home],
  ["about", "About us", Users],
  ["project", "Proyecto", Building2],
  ["location", "Ubicación", MapPin],
  ["amenities", "Áreas comunes", LayoutGrid],
  ["interiors", "Interiores", Images],
  ["departments", "Departamentos", DoorOpen],
  ["settings", "Configuración", Settings],
] as const;
type Props = {
  project: Project;
  updateProject: (p: Project | ((p: Project) => Project)) => Promise<void>;
  reload: () => Promise<void>;
  syncFromRemote: () => Promise<Project | null>;
  onExit: () => void;
};
export function AdminCMS({
  project,
  updateProject,
  reload,
  syncFromRemote,
  onExit,
}: Props) {
  const [unlocked, setUnlocked] = useState(false),
    [pin, setPin] = useState("");
  const [tab, setTab] = useState<string>("home");
  const [draft, setDraft] = useState(project),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [preview, setPreview] = useState(false);
  const current = useRef(draft);
  current.current = draft;
  useEffect(() => {
    if (!dirty) {
      setDraft(project);
      current.current = project;
    }
  }, [project]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  // Keep automatic remote synchronization from replacing an open editing session.
  useEffect(() => {
    document.documentElement.dataset.pardoEditing = "true";
    return () => {
      delete document.documentElement.dataset.pardoEditing;
    };
  }, []);
  const update = async (fn: (p: Project) => Project) => {
    const next = fn(current.current);
    current.current = next;
    setDraft(next);
    setDirty(true);
  };
  const action = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async (publish = false) => {
    await backupProject(project);
    const next = {
      ...(publish
        ? bumpVersion(current.current, "Publicación local desde el CMS")
        : current.current),
      localStatus: publish ? ("published-local" as const) : ("local" as const),
    };
    await updateProject(next);
    current.current = next;
    setDraft(next);
    setDirty(false);
    setMessage(
      publish
        ? "Publicado en este dispositivo. Para GitHub exporta y actualiza los archivos del repositorio."
        : "Cambios guardados en IndexedDB.",
    );
  };
  const field = (key: keyof Project, label: string, multiline = false) => (
    <label key={key}>
      {label}
      {multiline ? (
        <textarea
          className="field"
          value={String(draft[key] ?? "")}
          onChange={(e) =>
            void update((p) => ({ ...p, [key]: e.target.value }))
          }
        />
      ) : (
        <input
          className="field"
          type={key === "adminPin" ? "password" : "text"}
          value={String(draft[key] ?? "")}
          onChange={(e) =>
            void update((p) => ({ ...p, [key]: e.target.value }))
          }
        />
      )}
    </label>
  );
  const sections = (ids: string[]) =>
    draft.sections
      .filter((s) => ids.includes(s.id))
      .map((s) => (
        <section className="cms-card" key={s.id}>
          <h2>{s.title}</h2>
          <label>
            Título
            <input
              className="field"
              value={s.title}
              onChange={(e) =>
                void update((p) => ({
                  ...p,
                  sections: p.sections.map((i) =>
                    i.id === s.id ? { ...i, title: e.target.value } : i,
                  ),
                }))
              }
            />
          </label>
          <label>
            Descripción
            <textarea
              className="field"
              value={s.summary}
              onChange={(e) =>
                void update((p) => ({
                  ...p,
                  sections: p.sections.map((i) =>
                    i.id === s.id ? { ...i, summary: e.target.value } : i,
                  ),
                }))
              }
            />
          </label>
        </section>
      ));
  const galleries = (ids: string[]) =>
    draft.galleries
      .filter((g) => ids.includes(g.id))
      .map((g) => (
        <section className="cms-card" key={g.id}>
          <h2>{g.title}</h2>
          <details>
            <summary>Nombre de la galería</summary>
            <label>
              Título
              <input
                className="field"
                value={g.title}
                onChange={(e) =>
                  void update((p) => ({
                    ...p,
                    galleries: p.galleries.map((item) =>
                      item.id === g.id
                        ? { ...item, title: e.target.value }
                        : item,
                    ),
                  }))
                }
              />
            </label>
          </details>
          <ImageLibrary
            images={g.images}
            category={g.category}
            onChange={(images) =>
              void update((p) => ({
                ...p,
                sharedAreas:
                  g.id === "areas"
                    ? p.sharedAreas.map((label) => {
                        const prior = p.galleries
                          .find((item) => item.id === g.id)
                          ?.images.find((item) =>
                            sameAmenity(label, amenityName(item)),
                          );
                        const next = images.find(
                          (item) => item.id === prior?.id,
                        );
                        return prior && next && prior.title !== next.title
                          ? amenityName(next)
                          : label;
                      })
                    : p.sharedAreas,
                galleries: p.galleries.map((i) =>
                  i.id === g.id ? { ...i, images } : i,
                ),
              }))
            }
          />
        </section>
      ));
  if (!unlocked)
    return (
      <div className="cms-login">
        <button onClick={onExit}>← Volver a la presentación</button>
        <section className="cms-card">
          <p className="cms-eyebrow">MORADA · PARDO 664</p>
          <h1>Tu espacio de edición</h1>
          <p>Administra el contenido de esta presentación.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pin === project.adminPin) setUnlocked(true);
              else setMessage("PIN incorrecto.");
            }}
          >
            <label>
              PIN de acceso
              <input
                autoFocus
                className="field"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </label>
            <button className="cms-primary" type="submit">
              Ingresar
            </button>
          </form>
          <p role="status">{message}</p>
        </section>
      </div>
    );
  return (
    <div className="cms-shell">
      <aside className="cms-sidebar">
        <p className="cms-brand">
          morada<span>CONTENT STUDIO</span>
        </p>
        <div className="cms-project">
          <span>P</span>
          <div>
            <strong>{draft.name}</strong>
            <small>{draft.district}</small>
          </div>
        </div>
        <p className="cms-eyebrow">CONTENIDO</p>
        <nav aria-label="Secciones del administrador">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button
          className="cms-return"
          onClick={() => {
            if (
              !dirty ||
              confirm("Hay cambios pendientes. ¿Salir y descartar el borrador?")
            )
              onExit();
          }}
        >
          <ArrowLeft size={16} /> Ver presentación
        </button>
        <small>Solo Pardo 664 · v{draft.version.version}</small>
      </aside>
      <div className="cms-workspace">
        <header className="cms-toolbar">
          <div>
            <span className={`cms-status ${dirty ? "pending" : ""}`}>
              ●{" "}
              {dirty
                ? "Cambios pendientes"
                : draft.localStatus === "github"
                  ? "Sincronizado desde GitHub"
                  : draft.localStatus === "published-local"
                    ? "Publicado en este dispositivo"
                    : "Guardado localmente"}
            </span>
            <small>IndexedDB · disponible offline</small>
          </div>
          <div className="cms-actions">
            <button onClick={() => setPreview(!preview)}>
              <Eye size={16} /> Vista previa
            </button>
            <button
              className="cms-primary"
              disabled={busy || !dirty}
              onClick={() => void action(() => save())}
            >
              <Save size={16} />
              {busy ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </header>
        <main className="cms-main">
          <header className="cms-page-heading">
            <p className="cms-eyebrow">PARDO 664 / ADMINISTRADOR</p>
            <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
            <p>Actualiza el contenido a tu ritmo. Guarda cuando esté listo.</p>
          </header>
          {message && (
            <p className="cms-notice" role="status">
              {message}
            </p>
          )}
          <div className={preview ? "cms-with-preview" : ""}>
            <fieldset disabled={busy} className="cms-editors">
              {tab === "home" && (
                <>
                  <section className="cms-card">
                    <h2>Portada principal</h2>
                    <MediaInput
                      video
                      removeLabel={
                        draft.home?.mediaSrc
                          ? "Restaurar portada original"
                          : false
                      }
                      src={
                        draft.home?.mediaSrc ||
                        draft.galleries.find((g) => g.id === "fachada")
                          ?.images[0]?.src
                      }
                      onChange={(mediaSrc, mediaType) =>
                        void update((p) => ({
                          ...p,
                          home: { ...p.home, mediaSrc, mediaType },
                        }))
                      }
                    />
                    <div className="cms-fields">
                      {field("name", "Título")}
                      {field("tagline", "Subtítulo")}
                      {field("shortDescription", "Descripción", true)}
                      {(["primaryButton", "secondaryButton"] as const).map(
                        (key, i) => (
                          <label key={key}>
                            Texto de botón {i + 1}
                            <input
                              className="field"
                              value={
                                draft.home?.[key] ??
                                (i ? "DEPARTAMENTOS" : "Explorar el proyecto")
                              }
                              onChange={(e) =>
                                void update((p) => ({
                                  ...p,
                                  home: { ...p.home, [key]: e.target.value },
                                }))
                              }
                            />
                          </label>
                        ),
                      )}
                    </div>
                  </section>
                  <section className="cms-card">
                    <h2>Logo de Morada</h2>
                    <MediaInput
                      src={draft.logoSrc}
                      recommendation="SVG o PNG transparente · 600 px de ancho"
                      onChange={(logoSrc) =>
                        void update((p) => ({ ...p, logoSrc }))
                      }
                    />
                    {field("logoText", "Texto alternativo")}
                  </section>
                </>
              )}
              {tab === "about" && (
                <AboutEditor project={draft} update={update} />
              )}
              {tab === "project" && (
                <>
                  <section className="cms-card">
                    <h2>Identidad y datos generales</h2>
                    <div className="cms-fields">
                      {field("name", "Nombre del proyecto")}
                      {field("architect", "Arquitectos")}
                      {field("certification", "Certificación")}
                      {field("developer", "Desarrollador")}
                      {field("status", "Estado")}
                      {field("areaRange", "Rango de áreas")}
                      {field("typologySummary", "Resumen de tipologías")}
                    </div>
                    <label>
                      Atributos sostenibles (uno por línea)
                      <textarea
                        className="field"
                        value={draft.leedAttributes.join("\n")}
                        onChange={(e) =>
                          void update((p) => ({
                            ...p,
                            leedAttributes: e.target.value.split("\n"),
                          }))
                        }
                      />
                    </label>
                  </section>
                  {sections(["project", "architecture"])}
                  {galleries(
                    draft.galleries
                      .filter(
                        (g) =>
                          !["areas", "interiores", "barrio"].includes(g.id),
                      )
                      .map((g) => g.id),
                  )}
                </>
              )}
              {tab === "location" && <LocationEditor project={draft} update={update} />}
              {tab === "amenities" && (
                <>
                  {sections(["amenities"])}
                  <section className="cms-card">
                    <h2>Áreas comunes existentes</h2>
                    <p>
                      Se conservan las imágenes originales. Arrastra las
                      tarjetas para cambiar su orden.
                    </p>
                    <details>
                      <summary>
                        Etiquetas en la portada de áreas comunes
                      </summary>
                      <label>
                        Nombres de áreas (uno por línea)
                        <textarea
                          className="field"
                          value={draft.sharedAreas.join("\n")}
                          onChange={(e) =>
                            void update((p) => ({
                              ...p,
                              sharedAreas: e.target.value.split("\n"),
                            }))
                          }
                        />
                      </label>
                    </details>
                  </section>
                  {galleries(["areas"])}
                </>
              )}
              {tab === "interiors" && (
                <>
                  {sections(["interiors"])}
                  {galleries(["interiores"])}
                </>
              )}
              {tab === "departments" && (
                <VisualPlanEditor project={draft} update={update} />
              )}
              {tab === "settings" && (
                <>
                  <section className="cms-card">
                    <h2>Configuración del proyecto</h2>
                    <div className="cms-fields">
                      {field("name", "Nombre")}
                      {field("district", "Distrito")}
                      {field("address", "Dirección")}
                      {field("adminPin", "PIN del administrador")}
                    </div>
                    <MediaInput
                      src={draft.logoSrc}
                      onChange={(logoSrc) =>
                        void update((p) => ({ ...p, logoSrc }))
                      }
                    />
                    <p>
                      Versión {draft.version.version} ·{" "}
                      {draft.version.publishedAt}
                    </p>
                  </section>
                  {sections(
                    draft.sections
                      .filter(
                        (s) =>
                          ![
                            "project",
                            "architecture",
                            "location",
                            "amenities",
                            "interiors",
                          ].includes(s.id),
                      )
                      .map((s) => s.id),
                  )}
                  <section className="cms-card">
                    <h2>Publicación y respaldos</h2>
                    <p>
                      La publicación local actualiza este dispositivo. GitHub
                      requiere actualizar el repositorio con los archivos
                      exportados.
                    </p>
                    <div className="cms-settings-actions">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(async () => {
                            await exportProjectZip(current.current);
                            setMessage(
                              "ZIP exportado con el contenido del borrador.",
                            );
                          })
                        }
                      >
                        Exportar actualización ZIP
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(async () => {
                            await exportProjectJson(current.current);
                            setMessage("project.json descargado.");
                          })
                        }
                      >
                        Descargar project.json
                      </button>
                      <label className="cms-button">
                        Importar actualización ZIP
                        <input
                          hidden
                          type="file"
                          accept=".zip"
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file)
                              void action(async () => {
                                const imported = normalizeProject(
                                  await importProjectZip(file),
                                );
                                if (
                                  confirm("¿Cargar este ZIP como borrador?")
                                ) {
                                  await backupProject(project);
                                  current.current = imported;
                                  setDraft(imported);
                                  setDirty(true);
                                  setMessage(
                                    "ZIP cargado. Guarda para aplicar los cambios.",
                                  );
                                }
                              });
                          }}
                        />
                      </label>
                      <button
                        disabled={busy || dirty}
                        onClick={() =>
                          void action(async () => {
                            if (
                              (project.localStatus === "local" ||
                                project.localStatus === "published-local") &&
                              !confirm(
                                "Si GitHub tiene una versión nueva, reemplazará el contenido local. Se guardará un respaldo. ¿Continuar?",
                              )
                            )
                              return;
                            await backupProject(project);
                            const remote = await syncFromRemote();
                            setMessage(
                              remote
                                ? "Sincronizado desde GitHub."
                                : "No hay una versión más reciente disponible.",
                            );
                          })
                        }
                      >
                        Sincronizar desde GitHub
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => void action(() => save(true))}
                      >
                        Publicar en este dispositivo
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(async () => {
                            if (
                              confirm(
                                "¿Restaurar el contenido inicial? Se guardará un respaldo local.",
                              )
                            ) {
                              await backupProject(project);
                              await resetProject();
                              setDirty(false);
                              await reload();
                              setMessage("Contenido inicial restaurado.");
                            }
                          })
                        }
                      >
                        Restaurar contenido inicial
                      </button>
                    </div>
                    {dirty && (
                      <p>
                        Guarda o{" "}
                        <button
                          onClick={() => {
                            if (confirm("¿Descartar los cambios pendientes?")) {
                              current.current = project;
                              setDraft(project);
                              setDirty(false);
                            }
                          }}
                        >
                          Descarta el borrador
                        </button>{" "}
                        antes de sincronizar.
                      </p>
                    )}
                    <button
                      onClick={() =>
                        void action(async () => {
                          const backup = await getBackup();
                          if (backup) {
                            current.current = backup;
                            setDraft(backup);
                            setDirty(true);
                            setMessage("Respaldo recuperado como borrador.");
                          } else setMessage("No hay respaldo local todavía.");
                        })
                      }
                    >
                      Recuperar último respaldo
                    </button>
                  </section>
                  <section className="cms-card">
                    <details>
                      <summary>
                        Historial de versiones ({draft.version.changes.length})
                      </summary>
                      <div className="cms-history">
                        {draft.version.changes.map((c) => (
                          <p key={c.id}>
                            <strong>{c.date}</strong> · {c.text}
                          </p>
                        ))}
                      </div>
                    </details>
                  </section>
                </>
              )}
            </fieldset>
            {preview && (
              <aside className="cms-preview">
                <p className="cms-eyebrow">VISTA PREVIA DEL BORRADOR</p>
                <Preview project={draft} tab={tab} />
                <small>
                  Vista de contenido. Abre la presentación después de guardar
                  para revisar la navegación completa.
                </small>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
function Preview({ project: p, tab }: { project: Project; tab: string }) {
  const gallery = p.galleries.find(
    (g) =>
      g.id ===
      (
        {
          home: "fachada",
          project: "proyecto-fachada",
          amenities: "areas",
          interiors: "interiores",
          location: "barrio",
        } as Record<string, string>
      )[tab],
  );
  return (
    <article>
      {tab === "home" ? (
        <>
          <MediaPreview
            src={
              p.home?.mediaSrc ||
              gallery?.images.find((i) => i.visible !== false)?.src
            }
          />
          {p.logoSrc && (
            <img
              className="cms-preview-logo"
              src={p.logoSrc}
              alt={p.logoText}
            />
          )}
          <small>{p.tagline}</small>
          <h2>{p.name}</h2>
          <p>{p.shortDescription}</p>
          <div className="cms-actions">
            <span className="cms-button">
              {p.home?.primaryButton || "Explorar el proyecto"}
            </span>
            <span className="cms-button">
              {p.home?.secondaryButton || "DEPARTAMENTOS"}
            </span>
          </div>
        </>
      ) : tab === "about" ? (
        <>
          <MediaPreview src={p.about.coverImageSrc} />
          <h2>{p.about.title}</h2>
          <p>{p.about.subtitle}</p>
          {p.about.slides.map((s) => (
            <div key={s.id}>
              <MediaPreview src={s.imageSrc} />
              <p>{s.text}</p>
            </div>
          ))}
        </>
      ) : tab === "departments" ? (
        <>
          <MediaPreview src={p.floorPlan.imageSrc} />
          <h2>{p.typologies.length} tipologías</h2>
        </>
      ) : (
        <>
          <h2>{p.sections.find((s) => s.id === tab)?.title || p.name}</h2>
          <p>{p.sections.find((s) => s.id === tab)?.summary}</p>
          {gallery?.images
            .filter((i) => i.visible !== false)
            .map((i) => (
              <div key={i.id}>
                <MediaPreview src={i.src} />
                <h3>{i.title}</h3>
                <p>{i.description}</p>
              </div>
            ))}
        </>
      )}
    </article>
  );
}
function MediaPreview({ src }: { src?: string }) {
  return src ? (
    src.startsWith("data:video") ? (
      <video src={src} controls />
    ) : (
      <img src={src} alt="Vista previa del contenido" />
    )
  ) : null;
}
