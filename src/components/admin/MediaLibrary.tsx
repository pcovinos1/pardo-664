import { amenityName } from "../../data/amenityNames";
import { useRef, useState } from "react";
import { fileToDataUrl } from "../../services/files";
import type { GalleryImage } from "../../types/project";

async function readMedia(file: File, preserve = false): Promise<string> {
  if (
    preserve ||
    file.size < 1_500_000 ||
    !["image/jpeg", "image/webp"].includes(file.type)
  )
    return fileToDataUrl(file);
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const encoded = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.92),
        );
        if (encoded?.type === "image/webp" && encoded.size < file.size * 0.85)
          return fileToDataUrl(
            new File([encoded], file.name, { type: encoded.type }),
          );
      }
    } finally {
      bitmap.close();
    }
  } catch {
    /* Keep the original if optimization is unavailable. */
  }
  return fileToDataUrl(file);
}

export function MediaInput({
  src,
  onChange,
  video = false,
  preserve = false,
  removeLabel = "Quitar",
  recommendation = "2400 × 1600 px · JPG, PNG, WebP o SVG",
}: {
  src?: string;
  onChange: (src: string, type?: "image" | "video") => void;
  video?: boolean;
  preserve?: boolean;
  removeLabel?: string | false;
  recommendation?: string;
}) {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const read = async (file?: File) => {
    if (!file) return;
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
        ...(video ? ["video/mp4", "video/webm"] : []),
      ].includes(file.type)
    ) {
      setError("Formato no compatible. Usa los formatos indicados.");
      return;
    }
    try {
      onChange(
        await readMedia(file, preserve),
        file.type.startsWith("video") ? "video" : "image",
      );
      setError("");
    } catch {
      setError("No se pudo leer el archivo.");
    }
  };
  return (
    <div
      className="cms-media"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        e.stopPropagation();
        void read(e.dataTransfer.files[0]);
      }}
    >
      {src ? (
        <button
          type="button"
          className="cms-thumbnail"
          onClick={() => setPreview(true)}
          aria-label="Ampliar archivo"
        >
          {src.startsWith("data:video") || /\.(mp4|webm)($|\?)/i.test(src) ? (
            <video src={src} muted playsInline />
          ) : (
            <img src={src} alt="Vista previa" />
          )}
        </button>
      ) : (
        <div className="cms-empty">Arrastra un archivo aquí</div>
      )}
      <small>
        {recommendation}
        {video ? " · MP4 o WebM" : ""}
      </small>
      <div className="cms-actions">
        <label className="cms-button">
          {src ? "Reemplazar" : "Seleccionar archivo"}
          <input
            hidden
            type="file"
            accept={`image/png,image/jpeg,image/webp,image/svg+xml${video ? ",video/mp4,video/webm" : ""}`}
            onChange={(e) => {
              void read(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {src && removeLabel && (
          <button type="button" onClick={() => onChange("")}>
            {removeLabel}
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {preview && (
        <div
          className="cms-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada"
          onClick={() => setPreview(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setPreview(false);
          }}
        >
          <button autoFocus type="button" onClick={() => setPreview(false)}>
            Cerrar ×
          </button>
          {src?.startsWith("data:video") ||
          /\.(mp4|webm)($|\?)/i.test(src || "") ? (
            <video src={src} controls onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={src} alt="Vista ampliada" />
          )}
        </div>
      )}
    </div>
  );
}

export function ImageLibrary({
  images,
  onChange,
  category = "interiores",
  complementary = true,
}: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  category?: GalleryImage["category"];
  complementary?: boolean;
}) {
  const [environment, setEnvironment] = useState("");
  const environments = [
    ...new Set(
      images
        .map((image) => image.environment)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  const [drag, setDrag] = useState<string | null>(null);
  const [touchTarget, setTouchTarget] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const latest = useRef(images);
  latest.current = images;
  const change = (next: GalleryImage[]) => {
    latest.current = next;
    onChange(next);
  };
  const reorder = (id: string, targetId: string) => {
    if (id === targetId) return;
    const source = latest.current.find((image) => image.id === id);
    const target = latest.current.findIndex((image) => image.id === targetId);
    if (!source || target < 0) return;
    const next = latest.current.filter((image) => image.id !== id);
    next.splice(target, 0, source);
    change(next);
  };
  const touchDestination = (e: React.PointerEvent) => {
    const card = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-cms-image]");
    return card && card.parentElement === grid.current
      ? (card.dataset.cmsImage ?? null)
      : null;
  };
  const [error, setError] = useState("");
  const patch = (id: string, data: Partial<GalleryImage>) =>
    change(latest.current.map((i) => (i.id === id ? { ...i, ...data } : i)));
  const add = async (files: FileList) => {
    const result: GalleryImage[] = [];
    try {
      for (const file of Array.from(files)) {
        if (
          !["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(
            file.type,
          )
        )
          throw new Error("Solo se admiten JPG, PNG, WebP y SVG.");
        result.push({
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^.]+$/, ""),
          src: await readMedia(file),
          category,
          environment: environment || undefined,
        });
      }
      change([...latest.current, ...result]);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de carga");
    }
  };
  const move = (id: string, offset: number) => {
    const next = [...latest.current];
    const i = next.findIndex((x) => x.id === id);
    const j = Math.max(0, Math.min(next.length - 1, i + offset));
    [next[i], next[j]] = [next[j], next[i]];
    change(next);
  };
  return (
    <div>
      <div
        className="cms-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) void add(e.dataTransfer.files);
        }}
      >
        <label className="cms-button">
          ＋ Agregar imágenes
          <input
            hidden
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              if (e.target.files) void add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <span>
          {" "}
          o arrastra varios archivos · Reordena desde el asa de cada tarjeta
        </span>
      </div>
      {error && <p role="alert">{error}</p>}
      {category === "interiores" && environments.length > 0 && (
        <label>
          Filtrar por ambiente
          <select
            className="field"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            <option value="">Todos los ambientes</option>
            {environments.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      )}
      <div className="cms-image-grid" ref={grid}>
        {images.map(
          (image, index) =>
            (!environment || image.environment === environment) && (
              <article
                className={`cms-card ${touchTarget === image.id && drag !== image.id ? "cms-drop-target" : ""}`}
                data-cms-image={image.id}
                key={image.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (!drag) return;
                  e.preventDefault();
                  e.stopPropagation();
                  reorder(drag, image.id);
                  setDrag(null);
                }}
              >
                <div className="cms-actions">
                  <span
                    draggable
                    onDragStart={(e) => {
                      setDrag(image.id);
                      e.dataTransfer.setData("text/plain", image.id);
                    }}
                    onDragEnd={() => setDrag(null)}
                    onPointerDown={(e) => {
                      if (e.pointerType === "mouse") return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setDrag(image.id);
                    }}
                    onPointerMove={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId))
                        setTouchTarget(touchDestination(e));
                    }}
                    onPointerUp={(e) => {
                      if (!e.currentTarget.hasPointerCapture(e.pointerId))
                        return;
                      const target = touchDestination(e);
                      if (target) reorder(image.id, target);
                      setTouchTarget(null);
                      setDrag(null);
                    }}
                    onPointerCancel={() => {
                      setTouchTarget(null);
                      setDrag(null);
                    }}
                    className="cms-grip"
                    title="Arrastrar para reordenar"
                  >
                    ⠿ {index + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Subir imagen"
                    disabled={index === 0}
                    onClick={() => move(image.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Bajar imagen"
                    disabled={index === images.length - 1}
                    onClick={() => move(image.id, 1)}
                  >
                    ↓
                  </button>
                </div>
                <MediaInput
                  src={image.src}
                  onChange={(src) => patch(image.id, { src })}
                />
                <details>
                  <summary>
                    {category === "areas" ? amenityName(image) : image.title} ·
                    Editar
                  </summary>
                  <label>
                    Nombre
                    <input
                      className="field"
                      value={
                        category === "areas" ? amenityName(image) : image.title
                      }
                      onChange={(e) =>
                        patch(image.id, { title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Descripción
                    <textarea
                      className="field"
                      value={image.description || ""}
                      onChange={(e) =>
                        patch(image.id, { description: e.target.value })
                      }
                    />
                  </label>
                  {category === "interiores" && (
                    <label>
                      Ambiente
                      <input
                        className="field"
                        value={image.environment || ""}
                        onChange={(e) =>
                          patch(image.id, { environment: e.target.value })
                        }
                      />
                    </label>
                  )}
                  <div className="cms-actions">
                    <label>
                      <input
                        type="checkbox"
                        checked={image.visible !== false}
                        onChange={(e) =>
                          patch(image.id, { visible: e.target.checked })
                        }
                      />{" "}
                      Mostrar
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("¿Eliminar esta imagen del borrador?"))
                          change(
                            latest.current.filter((i) => i.id !== image.id),
                          );
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  {complementary &&
                    ["areas", "interiores", "barrio"].includes(category) && (
                      <details>
                        <summary>Galería complementaria</summary>
                        <ImageLibrary
                          complementary={false}
                          images={image.gallery || []}
                          category={category}
                          onChange={(gallery) => patch(image.id, { gallery })}
                        />
                      </details>
                    )}
                </details>
              </article>
            ),
        )}
      </div>
    </div>
  );
}
