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

export function isAllowedAsset(file: File): boolean {
  return ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"].includes(file.type);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export async function exportProjectZip(project: Project): Promise<void> {
  const zip = new JSZip();
  zip.file("pardo-664-project.json", JSON.stringify(project, null, 2));
  zip.file(
    "README.txt",
    `Pardo 664 Morada\nVersion: ${project.version.version}\nPublicado: ${project.version.publishedAt}\n\nImporta este ZIP desde el panel administrador de la app.`
  );
  const assets = collectAssetSources(project);
  await Promise.all(
    assets.map(async (src, index) => {
      try {
        const blob = src.startsWith("data:") ? dataUrlToBlob(src) : await fetch(src).then((response) => response.blob());
        const extension = extensionFromMime(blob.type) ?? extensionFromSource(src) ?? "bin";
        zip.file(`assets/asset-${String(index + 1).padStart(3, "0")}.${extension}`, blob);
      } catch {
        zip.file(`assets/asset-${String(index + 1).padStart(3, "0")}.txt`, `No se pudo copiar este asset: ${src}`);
      }
    })
  );
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pardo-664-${project.version.version}-${project.version.publishedAt}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportProjectJson(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "project.json";
  link.click();
  URL.revokeObjectURL(url);
}

function collectAssetSources(project: Project): string[] {
  const sources = new Set<string>();
  sources.add(project.floorPlan.imageSrc);
  project.galleries.forEach((gallery) => gallery.images.forEach((image) => sources.add(image.src)));
  project.typologies.forEach((typology) => {
    sources.add(typology.planSrc);
    sources.add(typology.thumbnailSrc);
    sources.add(typology.floorThumbnailSrc);
  });
  return [...sources].filter(Boolean);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, value] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extensionFromMime(mime: string): string | undefined {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/svg+xml": "svg",
    "application/pdf": "pdf"
  };
  return map[mime];
}

function extensionFromSource(src: string): string | undefined {
  return src.split("?")[0]?.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export async function importProjectZip(file: File): Promise<Project> {
  const zip = await JSZip.loadAsync(file);
  const json = zip.file("pardo-664-project.json");
  if (!json) throw new Error("El ZIP no contiene pardo-664-project.json.");
  const content = await json.async("string");
  const parsed = JSON.parse(content) as Project;
  if (!parsed.id || !parsed.typologies || !parsed.floorPlan) {
    throw new Error("El paquete no parece ser una actualización válida de Pardo 664.");
  }
  return parsed;
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
      changes: [{ id: crypto.randomUUID(), date, text: change }, ...project.version.changes]
    }
  };
}

export function compareProjectVersions(a: Project, b: Project): number {
  const versionResult = compareVersionStrings(a.version.version, b.version.version);
  if (versionResult !== 0) return versionResult;
  return a.version.publishedAt.localeCompare(b.version.publishedAt);
}

export async function fetchRemoteProject(current?: Project): Promise<Project | null> {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  const url = new URL("content/project.json", base);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const parsed = (await response.json()) as Project;
  if (!parsed.id || !parsed.version || !parsed.galleries || !parsed.floorPlan || !parsed.typologies) {
    throw new Error("El contenido publicado en GitHub no tiene un formato válido.");
  }
  if (current && compareProjectVersions(parsed, current) <= 0) return null;
  return parsed;
}

function compareVersionStrings(a: string, b: string): number {
  const left = a.split(".").map((part) => Number(part));
  const right = b.split(".").map((part) => Number(part));
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (Number.isFinite(left[index]) ? left[index] : 0) - (Number.isFinite(right[index]) ? right[index] : 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
