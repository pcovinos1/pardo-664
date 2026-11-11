import { MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { placePhoto } from "../../data/locationContent";
import type { LocationMapSettings, PointOfInterest } from "../../types/project";

type Position = { x: number; y: number };
type Camera = Position & { zoom: number };
type Props = {
  src: string;
  position: Position;
  name: string;
  points: PointOfInterest[];
  selected: string;
  settings: LocationMapSettings;
  onSelect: (id: string) => void;
};

const minZoom = 1;
const maxZoom = 4;
const zoomWithinLimits = (zoom: number) => Math.max(minZoom, Math.min(maxZoom, zoom));
const origin = { x: 0, y: 0 };
const ratio = 2591.78 / 2158.29;

function getGesture(pointers: Map<number, Position>) {
  const [a, b] = [...pointers.values()];
  if (!b) return { center: a, distance: 0 };
  return {
    center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    distance: Math.hypot(a.x - b.x, a.y - b.y),
  };
}

export function NeighborhoodMap({ src, position, name, points, selected, settings, onSelect }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Position>());
  const dragging = useRef(false);
  const suppressClick = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const initialZoom = zoomWithinLimits(settings.initialZoom || minZoom);
  const [camera, setCamera] = useState<Camera>({ ...origin, zoom: initialZoom });
  const [animate, setAnimate] = useState(false);
  const width = Math.min(size.width, size.height * ratio);
  const height = width / ratio;
  const active = selected === "project" ? position : points.find((point) => point.id === selected);
  const targetX = active?.x;
  const targetY = active?.y;

  useLayoutEffect(() => {
    const node = viewport.current!;
    const resize = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    resize.observe(node);
    return () => resize.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (targetX === undefined || targetY === undefined || !width) return;
    setAnimate(true);
    setCamera(({ zoom }) => {
      const next = Math.max(zoom, 1.65);
      return {
        x: (0.5 - targetX / 100) * width * next,
        y: (0.5 - targetY / 100) * height * next,
        zoom: next,
      };
    });
  }, [selected, targetX, targetY, width, height]);

  function zoomAround(current: Camera, zoom: number, from = origin, to = from) {
    const next = zoomWithinLimits(zoom);
    return bounded({
      zoom: next,
      x: to.x + (current.x - from.x) * next / current.zoom,
      y: to.y + (current.y - from.y) * next / current.zoom,
    });
  }

  function bounded(next: Camera): Camera {
    const limitX = width * next.zoom / 2;
    const limitY = height * next.zoom / 2;
    return {
      ...next,
      x: Math.max(-limitX, Math.min(limitX, next.x)),
      y: Math.max(-limitY, Math.min(limitY, next.y)),
    };
  }

  function release(pointerId: number) {
    pointers.current.delete(pointerId);
    if (!pointers.current.size) dragging.current = false;
  }

  function zoomBy(factor: number) {
    setAnimate(true);
    setCamera((current) => zoomAround(current, current.zoom * factor));
  }

  function recenter() {
    onSelect("");
    setAnimate(true);
    setCamera({
      zoom: initialZoom,
      x: (0.5 - position.x / 100) * width * initialZoom,
      y: (0.5 - position.y / 100) * height * initialZoom,
    });
  }

  const projectToScreen = (point: Position) => ({
    x: size.width / 2 + camera.x + (point.x / 100 - 0.5) * width * camera.zoom,
    y: size.height / 2 + camera.y + (point.y / 100 - 0.5) * height * camera.zoom,
  });
  const photoWidth = Math.min(112, Math.max(70, size.width * 0.13));
  const photoHeight = photoWidth * 1.36;
  const occupied = points.map(projectToScreen);
  const projectMarker = projectToScreen(position);
  occupied.push(projectMarker, { ...projectMarker, y: projectMarker.y - 38 });
  const cards: Array<{ id: string; point: PointOfInterest; src: string; x: number; y: number }> = [];
  if (!selected && size.width >= 310) {
    for (const photo of settings.floatingPhotos.slice(0, 3)) {
      const point = points.find((item) => item.id === photo.pointId);
      const image = point && placePhoto(point);
      if (!point || !image) continue;
      const anchor = projectToScreen(point);
      if (anchor.x < 0 || anchor.x > size.width || anchor.y < 0 || anchor.y > size.height) continue;
      const preferred = { x: size.width * photo.x / 100, y: size.height * photo.y / 100 };
      const candidates = [
        preferred,
        ...[1, -1, 2, -2].flatMap((offset) => [
          { x: preferred.x + offset * photoWidth * 0.6, y: preferred.y },
          { x: preferred.x, y: preferred.y + offset * photoHeight * 0.55 },
        ]),
      ];
      const center = candidates.find(({ x, y }) =>
        x - photoWidth / 2 >= 8 && x + photoWidth / 2 <= size.width - 8 &&
        y - photoHeight / 2 >= 8 && y + photoHeight / 2 <= size.height - 8 &&
        (x + photoWidth / 2 < size.width - 66 || y - photoHeight / 2 > 175) &&
        !occupied.some((marker) => Math.abs(x - marker.x) < photoWidth / 2 + 23 &&
          Math.abs(y - marker.y) < photoHeight / 2 + 23) &&
        !cards.some((card) => Math.abs(x - card.x) < photoWidth + 8 &&
          Math.abs(y - card.y) < photoHeight + 8)
      );
      if (center) cards.push({ id: point.id, point, src: image.src, ...center });
    }
  }

  return (
    <div className="barrio-map" aria-label="Mapa interactivo del entorno">
      <div
        ref={viewport}
        className="barrio-map-viewport"
        tabIndex={0}
        aria-label="Mapa de Miraflores. Usa las flechas para moverlo y los botones para acercar o alejar."
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const directions: Record<string, Position> = {
            ArrowLeft: { x: 55, y: 0 }, ArrowRight: { x: -55, y: 0 },
            ArrowUp: { x: 0, y: 55 }, ArrowDown: { x: 0, y: -55 },
          };
          const delta = directions[event.key];
          if (!delta) return;
          event.preventDefault();
          setAnimate(true);
          setCamera((current) => bounded({ ...current, x: current.x + delta.x, y: current.y + delta.y }));
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || pointers.current.size >= 2) return;
          if (!pointers.current.size) suppressClick.current = false;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2) {
            dragging.current = true;
            suppressClick.current = true;
            for (const id of pointers.current.keys()) event.currentTarget.setPointerCapture(id);
          }
        }}
        onPointerMove={(event) => {
          const previous = pointers.current.get(event.pointerId);
          if (!previous) return;
          const next = { x: event.clientX, y: event.clientY };
          if (!dragging.current && Math.hypot(next.x - previous.x, next.y - previous.y) < 6) return;
          dragging.current = true;
          suppressClick.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          const before = getGesture(pointers.current);
          pointers.current.set(event.pointerId, next);
          const after = getGesture(pointers.current);
          const rect = event.currentTarget.getBoundingClientRect();
          const relative = ({ x, y }: Position) => ({
            x: x - rect.left - rect.width / 2, y: y - rect.top - rect.height / 2,
          });
          setAnimate(false);
          setCamera((current) => zoomAround(
            current,
            before.distance ? current.zoom * after.distance / before.distance : current.zoom,
            relative(before.center),
            relative(after.center),
          ));
        }}
        onPointerUp={(event) => release(event.pointerId)}
        onPointerCancel={(event) => release(event.pointerId)}
        onPointerLeave={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) release(event.pointerId);
        }}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) event.stopPropagation();
        }}
      >
        <div
          className="barrio-map-art"
          data-animate={animate}
          style={{
            width: width * camera.zoom,
            height: height * camera.zoom,
            transform: `translate(calc(-50% + ${camera.x}px), calc(-50% + ${camera.y}px))`,
          }}
        >
          <img src={src} alt="Cartografía ilustrada de Miraflores" draggable={false} />
          {points.map((point) => (
            <button key={point.id} type="button" className="barrio-marker"
              aria-label={`${point.order}. ${point.name}`} aria-pressed={selected === point.id}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onSelect(point.id)}>
              <span className="barrio-marker-dot" aria-hidden="true">{point.order}</span>
            </button>
          ))}
          <button type="button" className="barrio-marker barrio-project-marker"
            aria-label={name} aria-pressed={selected === "project"}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            onClick={() => onSelect("project")}>
            <span className="barrio-marker-dot" aria-hidden="true"><MapPin size={18} /></span>
            <span className="barrio-project-name">{name}</span>
          </button>
        </div>
        {cards.map(({ id, point, src: photoSrc, x, y }) => (
          <button key={id} type="button" className="barrio-floating-photo"
            style={{ left: x, top: y, width: photoWidth, height: photoHeight }}
            onClick={() => onSelect(id)}>
            <img src={photoSrc} alt="" draggable={false} />
            <span><small>{point.order}</small>{point.name}</span>
          </button>
        ))}
      </div>
      <div className="barrio-zoom" role="group" aria-label="Controles de mapa">
        <button type="button" aria-label="Acercar mapa" disabled={camera.zoom >= maxZoom} onClick={() => zoomBy(1.35)}>
          <Plus size={21} />
        </button>
        <button type="button" aria-label="Alejar mapa" disabled={camera.zoom <= minZoom} onClick={() => zoomBy(1 / 1.35)}>
          <Minus size={21} />
        </button>
        <button type="button" aria-label="Recentrar en Pardo 664" onClick={recenter}>
          <RotateCcw size={17} />
        </button>
      </div>
    </div>
  );
}
