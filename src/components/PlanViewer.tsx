import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";

interface PlanNavigation {
  code: string;
  canNavigate: boolean;
  onMove: (direction: -1 | 1) => void;
  onClose: () => void;
}

export function FullscreenPlanViewer({ src, ...navigation }: PlanNavigation & { src: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const instructionsId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="plan-dialog"
      aria-labelledby={titleId}
      aria-describedby={instructionsId}
      onCancel={(event) => {
        event.preventDefault();
        navigation.onClose();
      }}
    >
      <p className="sr-only" id={instructionsId}>
        Usa las flechas izquierda y derecha para cambiar de plano.
        Mantén Mayús y usa las flechas para desplazar el plano ampliado. Pulsa Escape para cerrar.
      </p>
      <PlanViewer src={src} title={`Plano ${navigation.code}`} navigation={navigation} titleId={titleId} />
    </dialog>
  );
}

export function PlanViewer({ src, title, navigation, titleId }: {
  src: string;
  title: string;
  navigation?: PlanNavigation;
  titleId?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const minZoom = navigation ? 1 : 0.6;

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const changeZoom = (step: number) => {
    const next = Math.min(3, Math.max(minZoom, Math.round((zoom + step) * 10) / 10));
    setZoom(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  };

  const move = (direction: -1 | 1) => {
    if (!navigation?.canNavigate) return;
    reset();
    navigation.onMove(direction);
  };

  const zoomControls = (
    <div className="flex shrink-0" role="group" aria-label="Controles de zoom">
      <button className="icon-button" onClick={() => changeZoom(-0.2)} type="button" aria-label="Alejar" title="Alejar" disabled={zoom <= minZoom}>
        <Minus className="size-5" />
      </button>
      <button className="icon-button" onClick={() => changeZoom(0.2)} type="button" aria-label="Acercar" title="Acercar" disabled={zoom >= 3}>
        <Plus className="size-5" />
      </button>
      <button className="icon-button" onClick={reset} type="button" aria-label="Restablecer vista" title="Restablecer vista">
        <RotateCcw className="size-5" />
      </button>
    </div>
  );

  return (
    <div
      className={navigation ? "flex h-full flex-col bg-white text-ink" : "relative h-full min-h-[420px] overflow-hidden rounded border border-ink/10 bg-white"}
      onKeyDown={(event) => {
        if (!navigation || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.shiftKey && zoom > 1) {
          const x = event.key === "ArrowLeft" ? -32 : event.key === "ArrowRight" ? 32 : 0;
          const y = event.key === "ArrowUp" ? -32 : event.key === "ArrowDown" ? 32 : 0;
          if (!x && !y) return;
          event.preventDefault();
          setOffset((current) => ({ x: current.x + x, y: current.y + y }));
        } else if (!event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      {navigation ? (
        <header className="plan-toolbar">
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base" id={titleId} aria-live="polite">
            <span className="sr-only sm:not-sr-only">Tipología </span>{navigation.code}
          </h2>
          <div className="flex shrink-0" role="group" aria-label="Navegación de planos">
            <button className="icon-button" onClick={() => move(-1)} type="button" aria-label="Anterior" title="Anterior" disabled={!navigation.canNavigate}>
              <ChevronLeft className="size-5" /> <span className="hidden sm:inline">Anterior</span>
            </button>
            <button className="icon-button" onClick={() => move(1)} type="button" aria-label="Siguiente" title="Siguiente" disabled={!navigation.canNavigate}>
              <span className="hidden sm:inline">Siguiente</span> <ChevronRight className="size-5" />
            </button>
          </div>
          {zoomControls}
          <button className="icon-button shrink-0" onClick={navigation.onClose} type="button" aria-label="Cerrar visor" title="Cerrar visor">
            <X className="size-5" />
          </button>
        </header>
      ) : (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-paper/90 p-2">{zoomControls}</div>
      )}
      <div
        className={`overflow-hidden ${navigation ? "relative min-h-0 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-morada" : "absolute inset-0"} ${zoom === 1 ? "" : dragging ? "cursor-grabbing touch-none" : "cursor-grab touch-none"}`}
        tabIndex={navigation ? 0 : undefined}
        onPointerDown={(event) => {
          if (zoom === 1 || event.button !== 0 || drag.current) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { pointerId: event.pointerId, x: event.clientX - offset.x, y: event.clientY - offset.y };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (start?.pointerId !== event.pointerId) return;
          setOffset({ x: event.clientX - start.x, y: event.clientY - start.y });
        }}
        onLostPointerCapture={(event) => {
          if (drag.current?.pointerId !== event.pointerId) return;
          drag.current = null;
          setDragging(false);
        }}
      >
        <img
          className="absolute inset-0 h-full w-full select-none object-contain"
          src={src}
          alt={title}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          draggable={false}
        />
      </div>
    </div>
  );
}
