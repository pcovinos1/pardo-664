import JSZip from "jszip";
import type { Project } from "../types/project";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function exportProjectZip(project: Project): Promise<void> {
  const zip = new JSZip();
  const copy = portableProject(project);
  const entries = assetEntries(copy);
  const paths = new Map<string, Promise<string>>();
  await Promise.all(
    entries.map(async ({ src, write }) => {
      if (!paths.has(src)) {
        const index = paths.size + 1;
        paths.set(
          src,
          (async () => {
            const response = await fetch(src);
            if (!response.ok)
              throw new Error(
                "No se pudo copiar un archivo. Comprueba que esté disponible antes de exportar.",
              );
            const blob = await response.blob();
            if (
              !blob.type.startsWith("image/") &&
              !blob.type.startsWith("video/")
            )
              throw new Error(
                "No se pudo copiar un archivo de imagen o video.",
              );
            const extension =
              extensionFromMime(blob.type) ?? extensionFromSource(src) ?? "bin";
            const path = `assets/asset-${String(index).padStart(3, "0")}.${extension}`;
            zip.file(path, blob);
            return `pardo-asset:${path}`;
          })(),
        );
      }
      write(await paths.get(src)!);
    }),
  );
  zip.file("pardo-664-project.json", JSON.stringify(copy, null, 2));
  zip.file(
    "README.txt",
    `Pardo 664 Morada\nVersión: ${copy.version.version}\nImporta este paquete autónomo desde el administrador de Pardo 664.`,
  );
  downloadBlob(
    await zip.generateAsync({ type: "blob" }),
    `pardo-664-${copy.version.version}-${copy.version.publishedAt}.zip`,
  );
}

export async function exportProjectJson(project: Project): Promise<void> {
  downloadBlob(
    new Blob([JSON.stringify(portableProject(project), null, 2)], {
      type: "application/json",
    }),
    "project.json",
  );
}

function portableProject({
  lastPublishedSnapshot: _snapshot,
  localStatus: _status,
  ...project
}: Project): Project {
  return structuredClone(project);
}

function assetEntries(project: Project) {
  const entries: Array<{ src: string; write: (src: string) => void }> = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    for (const [key, item] of Object.entries(record)) {
      if (
        (key === "src" || key.endsWith("Src")) &&
        typeof item === "string" &&
        item
      )
        entries.push({
          src: item,
          write: (src) => {
            record[key] = src;
          },
        });
      else visit(item);
    }
  };
  visit(project);
  return entries;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 500);
}

function extensionFromMime(mime: string): string | undefined {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return map[mime];
}

function extensionFromSource(src: string): string | undefined {
  return src
    .split("?")[0]
    ?.split(".")
    .pop()
    ?.replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

export async function importProjectZip(file: File): Promise<Project> {
  const zip = await JSZip.loadAsync(file);
  const json = zip.file("pardo-664-project.json");
  if (!json) throw new Error("El ZIP no contiene pardo-664-project.json.");
  const content = await json.async("string");
  const parsed = JSON.parse(content) as Project;
  if (!isPardoProject(parsed)) {
    throw new Error(
      "El paquete no parece ser una actualización válida de Pardo 664.",
    );
  }
  const files = new Map<string, Promise<string>>();
  await Promise.all(
    assetEntries(parsed).map(async ({ src, write }) => {
      if (!src.startsWith("pardo-asset:")) return;
      const path = src.slice("pardo-asset:".length);
      if (!files.has(path))
        files.set(
          path,
          (async () => {
            const asset = zip.file(path);
            if (!asset) throw new Error(`Falta un archivo en el ZIP: ${path}`);
            const mime = (
              {
                png: "image/png",
                jpg: "image/jpeg",
                svg: "image/svg+xml",
                webp: "image/webp",
                mp4: "video/mp4",
                webm: "video/webm",
              } as Record<string, string>
            )[path.split(".").pop() ?? ""];
            if (!mime)
              throw new Error(`Formato de archivo no compatible: ${path}`);
            return `data:${mime};base64,${await asset.async("base64")}`;
          })(),
        );
      write(await files.get(path)!);
    }),
  );
  return parsed;
}

function isPardoProject(project: Project): boolean {
  return (
    project?.id === "pardo-664" &&
    typeof project.name === "string" &&
    typeof project.version?.version === "string" &&
    Array.isArray(project.version.changes) &&
    Array.isArray(project.sections) &&
    Array.isArray(project.galleries) &&
    Array.isArray(project.typologies) &&
    Array.isArray(project.floorPlan?.hotspots) &&
    typeof project.floorPlan.imageSrc === "string"
  );
}

export function bumpVersion(project: Project, change: string): Project {
  const parts = project.version.version.split(".").map(Number);
  const major = Number.isFinite(parts[0]) ? parts[0] : 1;
  const minor = Number.isFinite(parts[1]) ? parts[1] : 0;
  const version = `${major}.${minor + 1}`;
  const date = new Date().toISOString().slice(0, 10);
  return {
    ...project,
    version: {
      version,
      previousVersion: project.version.version,
      publishedAt: date,
      changes: [
        { id: crypto.randomUUID(), date, text: change },
        ...project.version.changes,
      ],
    },
  };
}

export function compareProjectVersions(a: Project, b: Project): number {
  const versionResult = compareVersionStrings(
    a.version.version,
    b.version.version,
  );
  if (versionResult !== 0) return versionResult;
  return a.version.publishedAt.localeCompare(b.version.publishedAt);
}

export async function fetchRemoteProject(
  current?: Project,
): Promise<Project | null> {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  const url = new URL("content/project.json", base);
  url.searchParams.set("sync", "1");
  const response = await fetch(url, { cache: "no-store" }).catch(() => {
    throw new Error("No se pudo conectar con el contenido publicado.");
  });
  if (!response.ok)
    throw new Error(
      "No se pudo consultar la versión publicada. Revisa la conexión e inténtalo de nuevo.",
    );
  const parsed = (await response.json()) as Project;
  if (!isPardoProject(parsed)) {
    throw new Error(
      "El contenido publicado en GitHub no tiene un formato válido.",
    );
  }
  if (current && compareProjectVersions(parsed, current) <= 0) return null;
  for (const { src, write } of assetEntries(parsed)) {
    if (src.startsWith("content/plans-v10/")) write(new URL(src, base).pathname);
  }
  return parsed;
}

function compareVersionStrings(a: string, b: string): number {
  const left = a.split(".").map((part) => Number(part));
  const right = b.split(".").map((part) => Number(part));
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff =
      (Number.isFinite(left[index]) ? left[index] : 0) -
      (Number.isFinite(right[index]) ? right[index] : 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
