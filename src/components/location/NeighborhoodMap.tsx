import { MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { PointOfInterest } from "../../types/project";

type Position = { x: number; y: number };
type Props = {
  src?: string;
  position: Position;
  name: string;
  points: PointOfInterest[];
  selected: string;
  onSelect: (id: string) => void;
};

export function NeighborhoodMap({
  src,
  position,
  name,
  points,
  selected,
  onSelect,
}: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    start: Position;
    offset: Position;
    moved: boolean;
  }>();
  const suppressClick = useRef(false);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [ratio, setRatio] = useState(1.2);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const width = Math.min(size.width, size.height * ratio);
  const height = width / ratio;

  useLayoutEffect(() => {
    const node = viewport.current!;
    const resize = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    resize.observe(node);
    return () => resize.disconnect();
  }, []);

  function clampPan(pan: Position, scale: number) {
    const x = Math.max(0, (width * scale - size.width) / 2);
    const y = Math.max(0, (height * scale - size.height) / 2);
    return {
      x: Math.min(x, Math.max(-x, pan.x)),
      y: Math.min(y, Math.max(-y, pan.y)),
    };
  }

  function changeZoom(next: number) {
    const scale = Math.min(4, Math.max(1, next));
    setOffset(
      scale === 1
        ? { x: 0, y: 0 }
        : clampPan(
            { x: (offset.x * scale) / zoom, y: (offset.y * scale) / zoom },
            scale,
          ),
    );
    setZoom(scale);
  }

  const pan = clampPan(offset, zoom);
  return (
    <div
      className="barrio-map"
      data-map-gesture
      aria-label="Mapa interactivo del entorno"
    >
      <div
        ref={viewport}
        className="barrio-map-viewport"
        data-zoomed={zoom > 1}
        tabIndex={0}
        aria-label="Mapa de Miraflores. Usa las flechas para mover el mapa ampliado."
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const directions: Record<string, Position> = {
            ArrowLeft: { x: 55, y: 0 },
            ArrowRight: { x: -55, y: 0 },
            ArrowUp: { x: 0, y: 55 },
            ArrowDown: { x: 0, y: -55 },
          };
          const delta = directions[event.key];
          if (!delta) return;
          event.preventDefault();
          setOffset(clampPan({ x: pan.x + delta.x, y: pan.y + delta.y }, zoom));
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          suppressClick.current = false;
          gesture.current = {
            id: event.pointerId,
            start: { x: event.clientX, y: event.clientY },
            offset: pan,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const start = gesture.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.start.x;
          const dy = event.clientY - start.start.y;
          if (!start.moved && Math.hypot(dx, dy) < 7) return;
          if (!start.moved) {
            start.moved = true;
            suppressClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          setOffset(
            clampPan({ x: start.offset.x + dx, y: start.offset.y + dy }, zoom),
          );
        }}
        onPointerUp={() => {
          gesture.current = undefined;
        }}
        onPointerCancel={() => {
          gesture.current = undefined;
        }}
        onPointerLeave={() => {
          if (!gesture.current?.moved) gesture.current = undefined;
        }}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        <div
          className="barrio-map-art"
          style={{
            width: width * zoom,
            height: height * zoom,
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
          }}
        >
          <img
            src={src}
            alt="Cartografía ilustrada de Miraflores"
            draggable={false}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalHeight) setRatio(naturalWidth / naturalHeight);
            }}
          />
          {points.map((point) => (
            <button
              key={point.id}
              type="button"
              className="barrio-marker"
              aria-label={point.name}
              aria-pressed={selected === point.id}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onSelect(point.id)}
            >
              <span>{point.order}</span>
            </button>
          ))}
          <button
            type="button"
            className="barrio-marker barrio-project-marker"
            aria-label={name}
            aria-pressed={selected === "project"}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            onClick={() => onSelect("project")}
          >
            <span>
              <MapPin size={18} />
            </span>
          </button>
        </div>
      </div>
      <div className="barrio-zoom" aria-label="Controles de mapa">
        <button
          type="button"
          aria-label="Acercar mapa"
          disabled={zoom >= 4}
          onClick={() => changeZoom(zoom * 1.45)}
        >
          <Plus size={21} />
        </button>
        <button
          type="button"
          aria-label="Alejar mapa"
          disabled={zoom <= 1}
          onClick={() => changeZoom(zoom / 1.45)}
        >
          <Minus size={21} />
        </button>
        <button
          type="button"
          aria-label="Restablecer mapa"
          onClick={() => changeZoom(1)}
        >
          <RotateCcw size={17} />
        </button>
      </div>
    </div>
  );
}
