import { ArrowRight, Building2, Check, ChevronLeft, ChevronRight, Download, FileUp, Grid3X3, Lock, RotateCcw, Save, Search, Upload } from "lucide-react";
import { useState } from "react";
import { FloorPlanInteractive } from "./components/FloorPlanInteractive";
import { GalleryModal } from "./components/GalleryModal";
import { GlobalNav } from "./components/GlobalNav";
import { PlanViewer } from "./components/PlanViewer";
import { useProject } from "./context/ProjectContext";
import { bumpVersion, exportProjectZip, fileToDataUrl, formatBytes, importProjectZip, isAllowedAsset } from "./services/files";
import { resetProject } from "./services/db";
import type { Gallery, GalleryImage, Project, Typology, ViewKey } from "./types/project";

const menuItems: Array<{ view: ViewKey; title: string; text: string }> = [
  { view: "project", title: "El proyecto", text: "LEED, Miraflores y visión Morada." },
  { view: "architecture", title: "Arquitectura", text: "Nómena Arquitectura y fachada tridimensional." },
  { view: "location", title: "Ubicación", text: "Mapa ilustrado con filtros offline." },
  { view: "amenities", title: "Áreas comunes", text: "Diez ambientes compartidos." },
  { view: "interiors", title: "Interiores", text: "Renders y propuesta de interiorismo." },
  { view: "departments", title: "Departamentos", text: "Tipologías, planta típica y planos." },
  { view: "contact", title: "Contacto", text: "Información comercial." }
];

export default function App() {
  const { project, loading, updateProject, reload } = useProject();
  const [view, setView] = useState<ViewKey>("home");
  const [selectedTypologyId, setSelectedTypologyId] = useState("a-1");
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; index: number } | null>(null);
  const [poiFilter, setPoiFilter] = useState("Todos");

  const selectedTypology = project?.typologies.find((item) => item.id === selectedTypologyId) ?? project?.typologies[0];
  const navigate = (next: ViewKey) => {
    setView(next);
  };

  if (loading || !project) {
    return <div className="grid min-h-screen place-items-center bg-paper text-ink">Cargando Pardo 664...</div>;
  }

  return (
    <main className="min-h-screen bg-paper pb-28 text-ink">
      <GlobalNav current={view} onNavigate={navigate} />
      {view === "home" && <Home project={project} onNavigate={navigate} />}
      {view === "menu" && <MenuPage onNavigate={navigate} />}
      {view === "project" && <ProjectPage project={project} onOpenGallery={setGallery} />}
      {view === "architecture" && <ArchitecturePage project={project} onOpenGallery={setGallery} />}
      {view === "amenities" && <AmenitiesPage project={project} onOpenGallery={setGallery} />}
      {view === "interiors" && <InteriorsPage project={project} onOpenGallery={setGallery} />}
      {view === "location" && <LocationPage project={project} filter={poiFilter} setFilter={setPoiFilter} onOpenGallery={setGallery} />}
      {view === "departments" && <DepartmentsPage project={project} selectedTypologyId={selectedTypologyId} setSelectedTypologyId={setSelectedTypologyId} onNavigate={navigate} />}
      {view === "floor" && (
        <FloorPage
          project={project}
          selectedTypologyId={selectedTypologyId}
          setSelectedTypologyId={setSelectedTypologyId}
          onNavigate={navigate}
        />
      )}
      {view === "typology" && selectedTypology && (
        <TypologyPage project={project} typology={selectedTypology} setSelectedTypologyId={setSelectedTypologyId} onNavigate={navigate} />
      )}
      {view === "compare" && <ComparePage project={project} />}
      {view === "contact" && <ContactPage project={project} />}
      {view === "admin" && <AdminPage project={project} updateProject={updateProject} reload={reload} />}
      {gallery ? <GalleryModal images={gallery.images} initialIndex={gallery.index} onClose={() => setGallery(null)} /> : null}
    </main>
  );
}

function Home({ project, onNavigate }: { project: Project; onNavigate: (view: ViewKey) => void }) {
  const hero = project.galleries.find((item) => item.id === "fachada")?.images[0]?.src;
  return (
    <section className="screen-section relative overflow-hidden bg-ink text-white">
      <img className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-72 transition duration-700" src={hero} alt="Render principal Pardo 664" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />
      <div className="relative z-10 flex min-h-screen max-w-7xl flex-col justify-between px-6 pb-32 pt-8 md:px-12">
        <header className="flex items-center justify-between">
          <p className="text-3xl font-bold tracking-tight">{project.logoText}</p>
          <button className="rounded-full bg-white/10 px-4 py-3 text-sm backdrop-blur" onClick={() => onNavigate("admin")} type="button">
            Administrador
          </button>
        </header>
        <div className="max-w-3xl pb-12">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/70">{project.tagline}</p>
          <h1 className="font-display text-6xl leading-none md:text-8xl">{project.name}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-white/90">{project.shortDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="primary-touch" onClick={() => onNavigate("project")} type="button">
              Explorar el proyecto <ArrowRight />
            </button>
            <button className="secondary-touch text-white" onClick={() => onNavigate("departments")} type="button">
              Ver departamentos <Building2 />
            </button>
          </div>
        </div>
        <p className="text-sm text-white/60">Modo presentación: la pantalla vuelve a esta portada al reiniciar la experiencia.</p>
      </div>
    </section>
  );
}

function MenuPage({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Menú principal" title="Una navegación pensada para sala de ventas" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {menuItems.map((item, index) => (
          <button key={item.view} className="group min-h-[190px] rounded border border-ink/10 bg-porcelain p-6 text-left transition hover:border-morada" onClick={() => onNavigate(item.view)} type="button">
            <span className="text-sm text-morada">{`${index + 1}`.padStart(2, "0")}</span>
            <h2 className="mt-8 font-display text-4xl">{item.title}</h2>
            <p className="mt-3 text-ink/70">{item.text}</p>
            <ArrowRight className="mt-5 text-morada transition group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </section>
  );
}

function ProjectPage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const images = project.galleries.find((item) => item.id === "fachada")?.images ?? [];
  return (
    <section className="editorial-page">
      <div className="editorial-hero">
        <button className="editorial-hero__image" onClick={() => onOpenGallery({ images, index: 0 })} type="button">
          <img src={images[0]?.src} alt="Pardo 664" />
        </button>
        <div className="editorial-hero__copy">
          <p className="eyebrow">El proyecto</p>
          <h1 className="editorial-title">{project.name}</h1>
          <p className="editorial-lead">{project.shortDescription}</p>
          <div className="editorial-stats">
            <Stat label="Arquitectura" value={project.architect} />
            <Stat label="Certificación" value={project.certification} />
            <Stat label="Distrito" value={project.district} />
            <Stat label="Áreas" value={project.areaRange} />
          </div>
        </div>
      </div>
      <div className="editorial-band">
        <div>
          <p className="eyebrow">Morada es verde</p>
          <h2 className="font-display text-4xl md:text-6xl">Un edificio de prestaciones ecoamigables.</h2>
        </div>
        <div className="editorial-list">
          {[...project.leedAttributes, "10 ambientes compartidos", project.typologySummary].map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function AmenitiesPage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const gallery = project.galleries.find((item) => item.id === "areas");
  return (
    <section className="editorial-page">
      <Photobook
        eyebrow="Áreas comunes"
        title="Diez espacios para habitar el día de otra manera."
        text="Desde una terraza con piscina en el rooftop hasta espacios para trabajar, entrenar y compartir."
        gallery={gallery}
        labels={project.sharedAreas}
        onOpenGallery={onOpenGallery}
      />
    </section>
  );
}

function ArchitecturePage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const gallery = project.galleries.find((item) => item.id === "arquitectura");
  const image = gallery?.images[0];
  return (
    <section className="editorial-page">
      <div className="architecture-layout">
        <button className="architecture-image" onClick={() => gallery && onOpenGallery({ images: gallery.images, index: 0 })} type="button">
          <img src={image?.src} alt="Nómena Arquitectura" />
        </button>
        <article className="architecture-copy">
          <p className="eyebrow">Arquitectura</p>
          <h1 className="editorial-title">Diseñado por Nómena Arquitectura.</h1>
          <p className="editorial-lead">
            Pardo 664 propone una fachada con profundidad tridimensional y una relación abierta con la avenida José Pardo.
          </p>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">
            El proyecto integra escala peatonal, transición de alturas y visuales cambiantes en una pieza residencial contemporánea para Miraflores.
          </p>
          <button className="editorial-link mt-8" onClick={() => gallery && onOpenGallery({ images: gallery.images, index: 0 })} type="button">
            Ver arquitectura <ArrowRight className="size-4" />
          </button>
        </article>
      </div>
    </section>
  );
}

function InteriorsPage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const baseGallery = project.galleries.find((item) => item.id === "interiores");
  const gallery = baseGallery
    ? {
        ...baseGallery,
        images: [
          ...baseGallery.images.map((image, index) => ({
            ...image,
            title: ["Sala", "Comedor", "Cocina"][index] ?? image.title
          })),
          ...baseGallery.images.map((image, index) => ({
            ...image,
            id: `${image.id}-detail-${index}`,
            title: ["Dormitorio principal", "Dormitorio secundario", "Baño"][index] ?? "Detalle de materiales"
          }))
        ]
      }
    : undefined;
  return (
    <section className="editorial-page">
      <Photobook
        eyebrow="Interiores"
        title="Una experiencia inmersiva de materiales, luz y escala."
        text="Puna Estudio y Morada Home llevan al proyecto una propuesta de interiorismo vanguardista y funcional."
        gallery={gallery}
        labels={["Sala", "Comedor", "Cocina", "Dormitorio principal", "Dormitorio secundario", "Baño", "Detalles de materiales"]}
        onOpenGallery={onOpenGallery}
      />
    </section>
  );
}

function LocationPage({ project, filter, setFilter, onOpenGallery }: { project: Project; filter: string; setFilter: (value: string) => void; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const categories = ["Todos", "Gastronomía", "Cafés", "Parques", "Educación", "Tiendas", "Entretenimiento"];
  const gallery = project.galleries.find((item) => item.id === "barrio");
  const visible = filter === "Todos" ? project.pointsOfInterest : project.pointsOfInterest.filter((poi) => poi.category === filter);
  return (
    <section className="editorial-page">
      <div className="location-scene">
        <div className="location-copy">
          <p className="eyebrow">Ubicación</p>
          <h1 className="editorial-title">{project.address}</h1>
          <p className="editorial-lead">Miraflores a escala caminable, con gastronomía, parques, cafés y servicios cerca de casa.</p>
        </div>
        <div className="location-map">
          <button className="block h-full w-full" onClick={() => gallery && onOpenGallery({ images: gallery.images, index: 0 })} type="button">
            <img className="h-full w-full object-contain" src={gallery?.images[0]?.src} alt="Mapa ilustrado offline" />
          </button>
          {visible.map((poi) => (
            <span key={poi.id} className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-morada text-xs font-bold text-white ring-4 ring-paper/90 transition duration-300" style={{ left: `${poi.x}%`, top: `${poi.y}%` }}>
              {poi.name.slice(0, 1)}
            </span>
          ))}
        </div>
        <div className="location-filters">
          {categories.map((category) => (
            <button key={category} className={`pill ${filter === category ? "pill-active" : ""}`} onClick={() => setFilter(category)} type="button">
              {category}
            </button>
          ))}
        </div>
        <div className="location-list">
          {visible.slice(0, 8).map((poi) => (
            <p key={poi.id}>
              <span>{poi.name}</span>
              <em>{poi.category}</em>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function Photobook({ eyebrow, title, text, gallery, labels, onOpenGallery }: { eyebrow: string; title: string; text: string; gallery?: Gallery; labels: string[]; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const [index, setIndex] = useState(0);
  if (!gallery || gallery.images.length === 0) return null;
  const active = gallery.images[index % gallery.images.length];
  const next = (direction: number) => setIndex((current) => (current + direction + gallery.images.length) % gallery.images.length);
  return (
    <div className="photobook">
      <div className="photobook-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="editorial-title">{title}</h1>
        <p className="editorial-lead">{text}</p>
        <div className="photobook-labels">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
      <div className="photobook-stage">
        <button className="photobook-main" onClick={() => onOpenGallery({ images: gallery.images, index })} type="button">
          <img src={active.src} alt={active.title} />
          <span>{active.title}</span>
        </button>
        <div className="photobook-controls">
          <button onClick={() => next(-1)} type="button" aria-label="Imagen anterior"><ChevronLeft /></button>
          <div>
            {gallery.images.map((image, dotIndex) => (
              <button key={image.id} className={dotIndex === index ? "is-active" : ""} onClick={() => setIndex(dotIndex)} type="button" aria-label={`Ver ${image.title}`} />
            ))}
          </div>
          <button onClick={() => next(1)} type="button" aria-label="Imagen siguiente"><ChevronRight /></button>
        </div>
        <div className="photobook-thumbs">
          {gallery.images.map((image, thumbIndex) => (
            <button key={image.id} className={thumbIndex === index ? "is-active" : ""} onClick={() => setIndex(thumbIndex)} type="button">
              <img src={image.src} alt={image.title} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DepartmentsPage({ project, selectedTypologyId, setSelectedTypologyId, onNavigate }: { project: Project; selectedTypologyId: string; setSelectedTypologyId: (id: string) => void; onNavigate: (view: ViewKey) => void }) {
  const [bedrooms, setBedrooms] = useState("Todos");
  const [area, setArea] = useState("Todas");
  const typologies = project.typologies.filter((item) => item.active);
  const filtered = typologies.filter((item) => (bedrooms === "Todos" || item.bedrooms === Number(bedrooms)) && (area === "Todas" || (area === "60-65" ? item.areaM2 <= 65 : item.areaM2 > 65)));
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Explorador" title="Departamentos y tipologías" />
      <div className="mb-5 flex flex-wrap gap-3">
        {["Todos", "1", "2", "3"].map((value) => (
          <button key={value} className={`pill ${bedrooms === value ? "pill-active" : ""}`} onClick={() => setBedrooms(value)} type="button">
            {value === "Todos" ? "Todos los dormitorios" : `${value} dorm.`}
          </button>
        ))}
        {["Todas", "60-65", "66+"].map((value) => (
          <button key={value} className={`pill ${area === value ? "pill-active" : ""}`} onClick={() => setArea(value)} type="button">
            {value === "Todas" ? "Todas las áreas" : value === "60-65" ? "60 a 65 m²" : "Más de 65 m²"}
          </button>
        ))}
        <button className="primary-touch ml-auto" onClick={() => onNavigate("floor")} type="button">
          Ver planta típica <Grid3X3 />
        </button>
        <button className="secondary-touch" onClick={() => onNavigate("compare")} type="button">
          Comparar <Search />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((typology) => (
          <article key={typology.id} className={`rounded border bg-porcelain p-4 ${selectedTypologyId === typology.id ? "border-morada" : "border-ink/10"}`}>
            <img className="h-44 w-full rounded border border-ink/10 bg-white object-contain" src={typology.thumbnailSrc} alt={`Plano ${typology.code}`} />
            <div className="mt-4 flex items-start justify-between">
              <div>
                <h2 className="font-display text-4xl">{typology.code}</h2>
                <p className="text-ink/70">{typology.areaM2} m² · {typology.bedrooms} dorm. · {typology.bathrooms ?? "s/d"} baños</p>
              </div>
              <span className="rounded-full bg-morada/10 px-3 py-1 text-sm text-morada">{typology.format}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="primary-touch flex-1" onClick={() => { setSelectedTypologyId(typology.id); onNavigate("typology"); }} type="button">
                Ver plano
              </button>
              <button className="secondary-touch flex-1" onClick={() => { setSelectedTypologyId(typology.id); onNavigate("floor"); }} type="button">
                En planta
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FloorPage({ project, selectedTypologyId, setSelectedTypologyId, onNavigate }: { project: Project; selectedTypologyId: string; setSelectedTypologyId: (id: string) => void; onNavigate: (view: ViewKey) => void }) {
  const typology = project.typologies.find((item) => item.id === selectedTypologyId);
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Planta típica" title="Pisos 3 al 12" text="La planta típica exhibida corresponde a los pisos 3 al 12 y se muestra únicamente para fines ilustrativos." />
      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <FloorPlanInteractive floorPlan={project.floorPlan} typologies={project.typologies} selectedId={selectedTypologyId} onSelect={setSelectedTypologyId} />
        <aside className="rounded border border-ink/10 bg-porcelain p-5">
          {typology ? (
            <>
              <p className="text-sm uppercase tracking-[0.25em] text-morada">Seleccionado</p>
              <h2 className="mt-3 font-display text-6xl">{typology.code}</h2>
              <p className="mt-2 text-xl">{typology.areaM2} m² · {typology.bedrooms} dorm.</p>
              <p className="mt-5 text-ink/70">{typology.apartments.length} departamentos asociados en el PDF.</p>
              <button className="primary-touch mt-6 w-full" onClick={() => onNavigate("typology")} type="button">
                Ver plano <ArrowRight />
              </button>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function TypologyPage({ project, typology, setSelectedTypologyId, onNavigate }: { project: Project; typology: Typology; setSelectedTypologyId: (id: string) => void; onNavigate: (view: ViewKey) => void }) {
  const active = project.typologies.filter((item) => item.active);
  const index = active.findIndex((item) => item.id === typology.id);
  const move = (direction: number) => {
    const next = active[(index + direction + active.length) % active.length];
    setSelectedTypologyId(next.id);
  };
  return (
    <section className="page-wrap">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow="Detalle de tipología" title={`Tipología ${typology.code}`} text={`${typology.areaM2} m² · ${typology.bedrooms} dormitorio(s) · ${typology.bathrooms ?? "s/d"} baño(s)`} />
        <div className="flex gap-2">
          <button className="secondary-touch" onClick={() => move(-1)} type="button"><ChevronLeft /> Anterior</button>
          <button className="secondary-touch" onClick={() => move(1)} type="button">Siguiente <ChevronRight /></button>
          <button className="primary-touch" onClick={() => onNavigate("floor")} type="button">Regresar a planta</button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <PlanViewer src={typology.planSrc} title={`Plano ${typology.code}`} />
        <aside className="space-y-4">
          <InfoBlock title="Ambientes" items={typology.rooms.map((room) => `${room.name}${room.dimensions ? ` (${room.dimensions})` : ""}`)} />
          <InfoBlock title="Departamentos asociados" items={typology.apartments.map((apartment) => apartment.label)} compact />
        </aside>
      </div>
    </section>
  );
}

function ComparePage({ project }: { project: Project }) {
  const [left, setLeft] = useState(project.typologies[0]?.id ?? "");
  const [right, setRight] = useState(project.typologies[1]?.id ?? "");
  const items = [project.typologies.find((item) => item.id === left), project.typologies.find((item) => item.id === right)].filter(Boolean) as Typology[];
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Comparador" title="Comparar dos tipologías" />
      <div className="mb-5 flex flex-wrap gap-3">
        {[left, right].map((value, index) => (
          <select key={index} className="min-h-12 rounded-full border border-ink/10 bg-white px-4" value={value} onChange={(event) => (index === 0 ? setLeft(event.target.value) : setRight(event.target.value))}>
            {project.typologies.map((typology) => <option key={typology.id} value={typology.id}>{typology.code}</option>)}
          </select>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((typology) => (
          <article key={typology.id} className="rounded border border-ink/10 bg-porcelain p-4">
            <h2 className="font-display text-5xl">{typology.code}</h2>
            <div className="my-4 grid grid-cols-2 gap-2 text-sm">
              <Fact label="Área" value={`${typology.areaM2} m²`} />
              <Fact label="Dormitorios" value={`${typology.bedrooms}`} />
              <Fact label="Baños" value={`${typology.bathrooms ?? "s/d"}`} />
              <Fact label="Terraza" value={typology.features.terrace ? "Sí" : "No"} />
              <Fact label="Estudio" value={typology.features.study ? "Sí" : "No"} />
              <Fact label="Walk-in closet" value={typology.features.walkInCloset ? "Sí" : "No"} />
            </div>
            <img className="h-[420px] w-full rounded bg-white object-contain" src={typology.planSrc} alt={`Plano ${typology.code}`} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactPage({ project }: { project: Project }) {
  return (
    <section className="editorial-page">
      <div className="contact-layout">
        <div>
          <p className="eyebrow">Contacto</p>
          <h1 className="editorial-title">Informes Pardo 664</h1>
          <p className="editorial-lead">Una conversación directa con el equipo comercial de Morada.</p>
        </div>
        <div className="contact-lines">
          <p><span>Proyecto</span>{project.name}</p>
          <p><span>Correo</span>informes@morada.pe</p>
          <p><span>Teléfono</span>(511) 300-6492</p>
          <p><span>WhatsApp</span>+51 990 930 808</p>
        </div>
      </div>
    </section>
  );
}

function AdminPage({ project, updateProject, reload }: { project: Project; updateProject: (updater: Project | ((project: Project) => Project)) => Promise<void>; reload: () => Promise<void> }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(project.typologies[0]?.id ?? "");
  const typology = project.typologies.find((item) => item.id === selected);

  const publish = async (change: string) => {
    await updateProject((current) => bumpVersion({ ...current, lastPublishedSnapshot: current }, change));
    setMessage("Cambios publicados localmente.");
  };

  if (!unlocked) {
    return (
      <section className="page-wrap max-w-xl">
        <PageHeading eyebrow="Administrador local" title="Ingrese PIN" text="PIN inicial del MVP: 6640. Puede cambiarse en los datos locales más adelante." />
        <div className="rounded border border-ink/10 bg-porcelain p-6">
          <Lock className="mb-4 text-morada" />
          <input className="field" type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN" />
          <button className="primary-touch mt-4 w-full" onClick={() => setUnlocked(pin === project.adminPin)} type="button">Entrar</button>
          {pin && pin !== project.adminPin ? <p className="mt-3 text-sm text-red-700">PIN incorrecto.</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Administrador local" title="Contenido, planos y respaldos" text={`Versión ${project.version.version} · Publicado ${project.version.publishedAt}`} />
      {message ? <p className="mb-4 rounded border border-morada/20 bg-morada/10 p-3 text-morada">{message}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-5">
          <AdminGeneral project={project} updateProject={updateProject} />
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Tipologías y planos</h2>
            <select className="field mb-4" value={selected} onChange={(event) => setSelected(event.target.value)}>
              {project.typologies.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
            </select>
            {typology ? <AdminTypology typology={typology} updateProject={updateProject} /> : null}
          </div>
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Zonas clicables de planta típica</h2>
            <FloorPlanInteractive
              editable
              floorPlan={project.floorPlan}
              typologies={project.typologies}
              selectedId={selected}
              onSelect={setSelected}
              onHotspotChange={(hotspot) => updateProject((current) => ({ ...current, floorPlan: { ...current.floorPlan, hotspots: current.floorPlan.hotspots.map((item) => item.id === hotspot.id ? hotspot : item) } }))}
            />
          </div>
        </div>
        <aside className="space-y-5">
          <AdminFiles project={project} selectedTypologyId={selected} updateProject={updateProject} />
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Importación, exportación y respaldo</h2>
            <button className="primary-touch mb-3 w-full" onClick={() => exportProjectZip(project)} type="button"><Download /> Exportar actualización</button>
            <label className="secondary-touch mb-3 w-full cursor-pointer justify-center">
              <FileUp /> Importar actualización
              <input className="hidden" type="file" accept=".zip,application/zip" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const imported = await importProjectZip(file);
                  if (confirm(`Importar versión ${imported.version.version}? Se reemplazarán los datos actuales.`)) {
                    await updateProject(imported);
                    setMessage("Actualización importada correctamente.");
                  }
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "No se pudo importar el ZIP.");
                }
              }} />
            </label>
            <button className="secondary-touch mb-3 w-full" onClick={async () => publish("Se publicaron cambios desde el administrador local.")} type="button"><Save /> Publicar cambios</button>
            <button className="secondary-touch w-full" onClick={async () => {
              if (confirm("Restaurar la información inicial extraída del PDF?")) {
                await resetProject();
                await reload();
                setMessage("Contenido inicial restaurado.");
              }
            }} type="button"><RotateCcw /> Restaurar inicial</button>
          </div>
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Historial local</h2>
            <div className="space-y-3">
              {project.version.changes.map((change) => <p key={change.id} className="border-b border-ink/10 pb-2 text-sm"><strong>{change.date}</strong><br />{change.text}</p>)}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AdminGeneral({ project, updateProject }: { project: Project; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const setField = (field: keyof Project, value: string) => updateProject((current) => ({ ...current, [field]: value }));
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Información general</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label>Título<input className="field" value={project.name} onChange={(event) => setField("name", event.target.value)} /></label>
        <label>Distrito<input className="field" value={project.district} onChange={(event) => setField("district", event.target.value)} /></label>
        <label>Arquitectos<input className="field" value={project.architect} onChange={(event) => setField("architect", event.target.value)} /></label>
        <label>Certificación<input className="field" value={project.certification} onChange={(event) => setField("certification", event.target.value)} /></label>
        <label className="md:col-span-2">Descripción<textarea className="field min-h-24" value={project.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} /></label>
      </div>
    </div>
  );
}

function AdminTypology({ typology, updateProject }: { typology: Typology; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const update = (patch: Partial<Typology>) => updateProject((project) => ({ ...project, typologies: project.typologies.map((item) => item.id === typology.id ? { ...item, ...patch } : item) }));
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <img className="h-64 w-full rounded bg-white object-contain" src={typology.planSrc} alt={`Plano ${typology.code}`} />
      <div className="grid gap-3 md:grid-cols-3">
        <label>Código<input className="field" value={typology.code} onChange={(event) => update({ code: event.target.value })} /></label>
        <label>Área m²<input className="field" type="number" value={typology.areaM2} onChange={(event) => update({ areaM2: Number(event.target.value) })} /></label>
        <label>Dormitorios<input className="field" type="number" value={typology.bedrooms} onChange={(event) => update({ bedrooms: Number(event.target.value) })} /></label>
        <label>Baños<input className="field" type="number" value={typology.bathrooms ?? 0} onChange={(event) => update({ bathrooms: Number(event.target.value) })} /></label>
        <label>Formato<input className="field" value={typology.format} onChange={(event) => update({ format: event.target.value as Typology["format"] })} /></label>
        <label className="flex items-center gap-2 pt-7"><input type="checkbox" checked={typology.active} onChange={(event) => update({ active: event.target.checked })} /> Activa</label>
        <label className="md:col-span-3">Ambientes<textarea className="field min-h-24" value={typology.rooms.map((room) => `${room.name}${room.dimensions ? ` (${room.dimensions})` : ""}`).join("\n")} onChange={(event) => update({ rooms: event.target.value.split("\n").filter(Boolean).map((line, index) => ({ id: `${index + 1}`, name: line })) })} /></label>
        <label className="md:col-span-3">Departamentos<textarea className="field min-h-20" value={typology.apartments.map((item) => item.label).join(", ")} onChange={(event) => update({ apartments: event.target.value.split(",").map((label) => label.trim()).filter(Boolean).map((label) => ({ id: label, label })) })} /></label>
      </div>
    </div>
  );
}

function AdminFiles({ project, selectedTypologyId, updateProject }: { project: Project; selectedTypologyId: string; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const [fileInfo, setFileInfo] = useState("");
  const replaceTypologyPlan = async (typologyId: string, file: File) => {
    if (!isAllowedAsset(file)) {
      setFileInfo("Tipo de archivo no permitido. Usa PNG, JPG, SVG o PDF.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setFileInfo(`${file.name} · ${formatBytes(file.size)} · listo para vista previa`);
    await updateProject((project) => ({
      ...project,
      typologies: project.typologies.map((item) => item.id === typologyId ? { ...item, planSrc: dataUrl, thumbnailSrc: dataUrl, updatedAt: new Date().toISOString() } : item)
    }));
  };
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Gestión de archivos</h2>
      <label className="field mb-3 block cursor-pointer text-center">
        <Upload className="mx-auto mb-2" /> Reemplazar plano de tipología
        <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml,application/pdf" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void replaceTypologyPlan(selectedTypologyId, file);
        }} />
      </label>
      <p className="text-sm text-ink/70">El archivo reemplaza el plano de la tipología seleccionada en el bloque principal. La versión anterior permanece en memoria hasta publicar o exportar.</p>
      {fileInfo ? <p className="mt-3 rounded bg-white p-3 text-sm">{fileInfo}</p> : null}
    </div>
  );
}

function GalleryStrip({ gallery, onOpenGallery }: { gallery?: { images: GalleryImage[]; title: string }; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  if (!gallery) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {gallery.images.map((image, index) => (
        <button key={image.id} className="image-panel min-h-[320px]" onClick={() => onOpenGallery({ images: gallery.images, index })} type="button">
          <img src={image.src} alt={image.title} />
          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium">{image.title}</span>
        </button>
      ))}
    </div>
  );
}

function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <header className="mb-8 max-w-4xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display text-5xl leading-tight md:text-7xl">{title}</h1>
      {text ? <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink/70">{text}</p> : null}
    </header>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-morada">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function InfoBlock({ title, items, compact }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">{title}</h2>
      <div className={`grid gap-2 ${compact ? "grid-cols-3" : "sm:grid-cols-2"}`}>
        {items.map((item) => (
          <p key={item} className="flex items-center gap-2 rounded bg-white/70 p-3 text-sm">
            <Check className="size-4 shrink-0 text-morada" /> {item}
          </p>
        ))}
      </div>
    </div>
  );
}
