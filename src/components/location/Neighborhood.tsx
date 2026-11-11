import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Hand,
  MapPin,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { getNeighborhood } from "../../data/locationContent";
import type { Project } from "../../types/project";
import { NeighborhoodMap } from "./NeighborhoodMap";
import "./neighborhood.css";

const filterLabels: Record<string, string> = {
  Parques: "Parques y malecón",
  Tiendas: "Comercios",
};

function canSwipe(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !target.closest("[data-map-gesture], button, select, input, a")
  );
}

function creditLink(value?: string) {
  return value && /^https?:\/\//i.test(value) ? value : undefined;
}

export function Neighborhood({ project }: { project: Project }) {
  const { story, mapCopy, mapSrc, position } = getNeighborhood(project);
  const photos = story.images.filter(
    (image) => image.visible !== false && image.src,
  );
  const [photoId, setPhotoId] = useState(photos[0]?.id);
  const [mapOpen, setMapOpen] = useState(false);
  const [hintSeen, setHintSeen] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState("");
  const pointer = useRef<{ id: number; x: number; y: number }>();
  const wheel = useRef({ at: 0, distance: 0, changed: false });
  const action = useRef<HTMLButtonElement>(null);
  const active = photos.find((photo) => photo.id === photoId) ?? photos[0];
  const points = project.pointsOfInterest
    .filter((point) => point.visible)
    .sort((a, b) => a.order - b.order);
  const categories = [...new Set(points.map((point) => point.category))];
  const visible = points.filter(
    (point) => !filter || point.category === filter,
  );
  const selectedPoint = visible.find((point) => point.id === selected);

  function navigate(next: boolean) {
    setMapOpen(next);
    if (next) setHintSeen(true);
    pointer.current = undefined;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.closest(".barrio-slide"))
      action.current?.focus({ preventScroll: true });
  }

  function swipe(distance: number) {
    if (!mapOpen && distance < -55) navigate(true);
    if (mapOpen && distance > 55) navigate(false);
  }

  function advancePhoto(direction: number) {
    const index = photos.findIndex((photo) => photo.id === active?.id);
    setPhotoId(photos[(index + direction + photos.length) % photos.length]?.id);
  }

  return (
    <section
      className="barrio"
      data-screen={mapOpen ? "map" : "story"}
      aria-label="El Barrio"
      onPointerDown={(event) => {
        pointer.current = undefined;
        if (event.isPrimary && event.button === 0 && canSwipe(event.target)) {
          pointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
        }
      }}
      onPointerUp={(event) => {
        const start = pointer.current;
        if (start?.id !== event.pointerId) return;
        pointer.current = undefined;
        const dx = event.clientX - start.x;
        if (Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.4) swipe(dx);
      }}
      onPointerCancel={() => {
        pointer.current = undefined;
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") pointer.current = undefined;
      }}
      onWheel={(event) => {
        if (
          !canSwipe(event.target) ||
          event.ctrlKey ||
          Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.4
        )
          return;
        const now = performance.now();
        if (now - wheel.current.at > 220)
          wheel.current = { at: now, distance: 0, changed: false };
        wheel.current.at = now;
        if (wheel.current.changed) return;
        wheel.current.distance +=
          event.deltaX * (event.deltaMode === 1 ? 16 : 1);
        if (
          (!mapOpen && wheel.current.distance > 55) ||
          (mapOpen && wheel.current.distance < -55)
        ) {
          wheel.current.changed = true;
          swipe(-wheel.current.distance);
        }
      }}
    >
      <div className="barrio-window">
        <div className="barrio-track">
          <section
            className="barrio-slide barrio-story"
            aria-hidden={mapOpen}
            aria-label="Descubre Miraflores"
          >
            {active && (
              <img
                className="barrio-hero"
                key={active.id}
                src={active.src}
                alt={active.description || active.title}
                draggable={false}
              />
            )}
            <div className="barrio-story-shade" />
            {photos.length > 1 && (
              <div className="barrio-arrows">
                <button
                  type="button"
                  aria-label="Fotografía anterior"
                  onClick={() => advancePhoto(-1)}
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  aria-label="Fotografía siguiente"
                  onClick={() => advancePhoto(1)}
                >
                  <ChevronRight />
                </button>
              </div>
            )}
            <div className="barrio-story-copy">
              <p className="barrio-kicker">El barrio · Miraflores</p>
              <h1>{story.title}</h1>
              <p>{story.description}</p>
            </div>
            <div className="barrio-story-bottom">
              {active && (
                <p className="barrio-credit" aria-live="polite">
                  {active.description || active.title}
                  {active.credit && (
                    <>
                      {" "}
                      ·{" "}
                      {creditLink(active.creditSource) ? (
                        <a
                          href={creditLink(active.creditSource)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {active.credit}
                        </a>
                      ) : (
                        active.credit
                      )}
                    </>
                  )}
                  {creditLink(active.creditLicense) && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={creditLink(active.creditLicense)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Licencia
                      </a>
                    </>
                  )}
                </p>
              )}
              <div
                className="barrio-thumbnails"
                aria-label="Categorías fotográficas"
              >
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setPhotoId(photo.id)}
                    aria-pressed={active?.id === photo.id}
                  >
                    <img src={photo.src} alt="" draggable={false} />
                    <span>{photo.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section
            className="barrio-slide barrio-explore"
            aria-hidden={!mapOpen}
            aria-label="Explora el entorno"
          >
            <aside className="barrio-map-copy">
              <p className="barrio-kicker">El barrio · Miraflores</p>
              <h1>{mapCopy.title}</h1>
              <p>{mapCopy.description}</p>
              <div className="barrio-filters" role="group" aria-label="Categorías del mapa">
                {["", ...categories].map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={filter === category}
                    onClick={() => {
                      setFilter(category);
                      setSelected("");
                    }}
                  >
                    {category ? (filterLabels[category] ?? category) : "Todos"}
                  </button>
                ))}
              </div>
            </aside>
            <div className="barrio-map-panel" data-map-gesture>
              <NeighborhoodMap
                src={mapSrc}
                position={position}
                name={project.name}
                points={visible}
                selected={selected}
                onSelect={setSelected}
              />
              {(selectedPoint || selected === "project") && (
                <article className="barrio-place" aria-live="polite">
                  <p className="barrio-kicker">
                    {selectedPoint
                      ? (filterLabels[selectedPoint.category] ??
                        selectedPoint.category)
                      : "Miraflores"}
                  </p>
                  <h2>{selectedPoint?.name ?? project.name}</h2>
                  <p>
                    {selectedPoint
                      ? selectedPoint.description
                      : project.address}
                  </p>
                  <button
                    type="button"
                    aria-label="Cerrar información del lugar"
                    onClick={() => setSelected("")}
                  >
                    <X size={19} />
                  </button>
                </article>
              )}
            </div>
          </section>
        </div>
      </div>
      <footer className="barrio-footer">
        <div className="barrio-progress" aria-live="polite" aria-atomic="true">
          <span>
            <strong>{mapOpen ? "02" : "01"}</strong> / 02
          </span>
          <span>{mapOpen ? "Explora el entorno" : "Descubre Miraflores"}</span>
          <div className="barrio-progress-track" aria-hidden="true">
            <i />
            <i />
          </div>
        </div>
        {!mapOpen && !hintSeen && (
          <p className="barrio-hint">
            <span aria-hidden="true">
              <ArrowLeft size={15} />
              <Hand size={20} />
            </span>
            Desliza hacia la izquierda para explorar el mapa
          </p>
        )}
        {!mapOpen && (
          <button
            type="button"
            className="barrio-map-preview"
            aria-label="Abrir vista previa del mapa del entorno"
            onClick={() => navigate(true)}
          >
            <img src={mapSrc} alt="" draggable={false} />
            <MapPin
              size={17}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            />
          </button>
        )}
        <button
          ref={action}
          type="button"
          className="barrio-action"
          onClick={() => navigate(!mapOpen)}
        >
          {mapOpen && <ArrowLeft size={18} />}
          {mapOpen ? "Descubre Miraflores" : "Ver mapa del entorno"}
          {!mapOpen && <ArrowRight size={18} />}
        </button>
      </footer>
    </section>
  );
}
