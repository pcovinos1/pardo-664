import { useState } from "react";
import {
  defaultMapSettings,
  getNeighborhood,
  placeDescription,
  placePhoto,
  pointCategories,
} from "../../data/locationContent";
import type {
  FloatingPhoto,
  LocationMapSettings,
  PointOfInterest,
  Project,
} from "../../types/project";
import { ImageLibrary, MediaInput } from "./MediaLibrary";

const tabs = ["Contenido", "Lugares", "Mapa"] as const;

export function LocationEditor({
  project,
  update,
}: {
  project: Project;
  update: (fn: (p: Project) => Project) => Promise<void>;
}) {
  const [selected, setSelected] = useState(project.pointsOfInterest[0]?.id ?? "");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Contenido");
  const [adding, setAdding] = useState(false);
  const { story, mapCopy, mapSrc, position, settings } = getNeighborhood(project);
  const poi = project.pointsOfInterest.find((point) => point.id === selected);
  const available = project.pointsOfInterest.filter(
    (point) => point.visible && placePhoto(point),
  );

  const patch = (data: Partial<PointOfInterest>) =>
    update((current) => ({
      ...current,
      locationMap: current.locationMap ?? defaultMapSettings,
      pointsOfInterest: current.pointsOfInterest.map((point) =>
        point.id === selected ? { ...point, ...data } : point,
      ),
    }));

  const patchSettings = (data: Partial<LocationMapSettings>) =>
    update((current) => ({
      ...current,
      locationMap: { ...(current.locationMap ?? defaultMapSettings), ...data },
    }));

  function patchPhoto(index: number, patch: Partial<FloatingPhoto>) {
    void patchSettings({
      floatingPhotos: settings.floatingPhotos.map((photo, slot) =>
        slot === index ? { ...photo, ...patch } : photo,
      ),
    });
  }

  function addPlace(x: number, y: number) {
    const id = crypto.randomUUID();
    void update((current) => ({
      ...current,
      pointsOfInterest: [...current.pointsOfInterest, {
        id, x, y, name: "Nuevo lugar", category: "Servicios", visible: false,
        order: Math.max(0, ...current.pointsOfInterest.map((point) => point.order)) + 1,
      }],
    }));
    setSelected(id);
    setAdding(false);
  }

  return (
    <>
      <div className="cms-actions" role="group" aria-label="Opciones de ubicación">
        {tabs.map((label) => (
          <button key={label} className={tab === label ? "cms-primary" : ""}
            aria-pressed={tab === label} onClick={() => setTab(label)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "Contenido" && (
        <section className="cms-card">
          <h2>Contenido de ubicación</h2>
          <label>
            Título
            <input className="field" value={mapCopy.title}
              onChange={({ target: { value } }) => void update((p) => ({
                ...p, locationMapCopy: { ...getNeighborhood(p).mapCopy, title: value },
              }))} />
          </label>
          <label>
            Descripción
            <textarea className="field" value={mapCopy.description}
              onChange={({ target: { value } }) => void update((p) => ({
                ...p, locationMapCopy: { ...getNeighborhood(p).mapCopy, description: value },
              }))} />
          </label>
          <details>
            <summary>Presentación fotográfica del barrio</summary>
            <label>
              Título de la presentación
              <input className="field" value={story.title}
                onChange={({ target: { value } }) => void update((p) => ({
                  ...p, locationStory: { ...getNeighborhood(p).story, title: value },
                }))} />
            </label>
            <label>
              Descripción de la presentación
              <textarea className="field" value={story.description}
                onChange={({ target: { value } }) => void update((p) => ({
                  ...p, locationStory: { ...getNeighborhood(p).story, description: value },
                }))} />
            </label>
            <ImageLibrary category="barrio" complementary={false} images={story.images}
              onChange={(images) => void update((p) => ({
                ...p, locationStory: { ...getNeighborhood(p).story, images },
              }))} />
          </details>
        </section>
      )}
      {tab === "Lugares" && (
        <div className="cms-plan-layout">
          <section className="cms-card">
            <h2>Lugares del entorno</h2>
            <button type="button" className="cms-primary" aria-pressed={adding}
              onClick={() => setAdding(!adding)}>
              {adding ? "Cancelar nuevo lugar" : "Agregar lugar"}
            </button>
            {adding && <p>Toca el mapa para ubicar el nuevo lugar. Luego completa sus datos y actívalo.</p>}
            <div className="cms-plan cms-location-preview" style={{ cursor: adding ? "crosshair" : undefined }}
              onClick={(event) => {
                if (!adding) return;
                const rect = event.currentTarget.getBoundingClientRect();
                addPlace(100 * (event.clientX - rect.left) / rect.width,
                  100 * (event.clientY - rect.top) / rect.height);
              }}>
              <img src={mapSrc} alt="Mapa de Miraflores" draggable={false} />
              <span className="cms-map-marker selected" style={{
                left: `${position.x}%`, top: `${position.y}%`, pointerEvents: "none",
              }} aria-label="Pardo 664">P</span>
              {project.pointsOfInterest.map((point) => (
                <button key={point.id} type="button"
                  className={`cms-map-marker ${selected === point.id ? "selected" : ""}`}
                  style={{ left: `${point.x}%`, top: `${point.y}%`, opacity: point.visible ? 1 : 0.45 }}
                  title={point.name} aria-label={point.name}
                  onClick={(event) => {
                    if (adding) return;
                    event.stopPropagation();
                    setSelected(point.id);
                  }}>
                  {point.order}
                </button>
              ))}
            </div>
          </section>
          <section className="cms-card">
            <label>
              Lugar
              <select className="field" value={selected} onChange={(event) => setSelected(event.target.value)}>
                {project.pointsOfInterest.map((point) => (
                  <option key={point.id} value={point.id}>{point.order}. {point.name}</option>
                ))}
              </select>
            </label>
            {poi && (
              <>
                <label>
                  Nombre
                  <input className="field" value={poi.name}
                    onChange={(event) => void patch({ name: event.target.value })} />
                </label>
                <label>
                  Categoría
                  <select className="field" value={poi.category}
                    onChange={(event) => void patch({ category: event.target.value as PointOfInterest["category"] })}>
                    {pointCategories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Descripción
                  <textarea className="field" value={placeDescription(poi)}
                    onChange={(event) => void patch({ description: event.target.value })} />
                </label>
                <label>
                  <input type="checkbox" checked={poi.visible}
                    onChange={(event) => void patch({ visible: event.target.checked })} />
                  {" "}Lugar activo
                </label>
                <h3>Fotografía del lugar</h3>
                <MediaInput key={poi.id} src={placePhoto(poi)?.src} recommendation="Encuadre vertical · JPG, PNG o WebP"
                  onChange={(photoSrc) => void patch({ photoSrc })} />
              </>
            )}
          </section>
        </div>
      )}
      {tab === "Mapa" && (
        <section className="cms-card">
          <h2>Mapa y fotografías flotantes</h2>
          <label>
            Zoom inicial · {settings.initialZoom.toFixed(2)}×
            <input className="field" type="range" min="1" max="4" step="0.05" value={settings.initialZoom}
              onChange={(event) => void patchSettings({ initialZoom: Number(event.target.value) })} />
          </label>
          <p>Configura hasta tres fotografías de lugares activos. La posición se mide como porcentaje del área visible del mapa.</p>
          {settings.floatingPhotos.map((photo, index) => (
            <fieldset className="cms-card" key={index}>
              <legend>Fotografía {index + 1}</legend>
              <label>
                Lugar
                <select className="field" value={photo.pointId}
                  onChange={(event) => patchPhoto(index, { pointId: event.target.value })}>
                  {!available.some((point) => point.id === photo.pointId) && (
                    <option value={photo.pointId}>Lugar inactivo o sin fotografía</option>
                  )}
                  {available.filter((point) => point.id === photo.pointId ||
                    !settings.floatingPhotos.some((item) => item.pointId === point.id))
                    .map((point) => <option key={point.id} value={point.id}>{point.order}. {point.name}</option>)}
                </select>
              </label>
              <label>
                Posición horizontal · {photo.x}%
                <input className="field" type="range" min="0" max="100" value={photo.x}
                  onChange={(event) => patchPhoto(index, { x: Number(event.target.value) })} />
              </label>
              <label>
                Posición vertical · {photo.y}%
                <input className="field" type="range" min="0" max="100" value={photo.y}
                  onChange={(event) => patchPhoto(index, { y: Number(event.target.value) })} />
              </label>
              <button type="button" onClick={() => void patchSettings({
                floatingPhotos: settings.floatingPhotos.filter((_, slot) => slot !== index),
              })}>Quitar fotografía flotante</button>
            </fieldset>
          ))}
          {settings.floatingPhotos.length < 3 && (
            <button type="button" onClick={() => {
              const point = available.find((item) =>
                !settings.floatingPhotos.some((photo) => photo.pointId === item.id),
              );
              if (point) void patchSettings({
                floatingPhotos: [...settings.floatingPhotos, { pointId: point.id, x: 75, y: 75 }],
              });
            }} disabled={available.every((point) => settings.floatingPhotos.some((photo) => photo.pointId === point.id))}>
              Agregar fotografía flotante
            </button>
          )}
        </section>
      )}
    </>
  );
}
