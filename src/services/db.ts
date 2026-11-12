import { openDB } from "idb";
import type { Project } from "../types/project";
import { defaultPointCategory } from "../data/locationContent";
import { initialProject } from "../data/initialProject";

const DB_NAME = "pardo-664-local";
const STORE = "project";
const PROJECT_KEY = "active";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE);
  },
});

export async function getProject(): Promise<Project> {
  const db = await dbPromise;
  const saved = await db.get(STORE, PROJECT_KEY);
  if (saved) {
    const normalized = normalizeProject(saved as Project);
    return normalized;
  }
  await db.put(STORE, initialProject, PROJECT_KEY);
  return initialProject;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE, project, PROJECT_KEY);
}

export async function resetProject(): Promise<Project> {
  const restored: Project = { ...initialProject, localStatus: "local" };
  await saveProject(restored);
  return restored;
}

export async function backupProject(project: Project): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE, project, "cms-backup");
}

export async function getBackup(): Promise<Project | undefined> {
  const db = await dbPromise;
  return db.get(STORE, "cms-backup");
}

export function normalizeProject(project: Project): Project {
  const logoSrc =
    typeof project.logoSrc === "string"
      ? project.logoSrc
      : initialProject.logoSrc;
  const about = project.about
    ? {
        ...initialProject.about,
        ...project.about,
        slides: project.about.slides ?? initialProject.about.slides,
        projects: Array.isArray(project.about.projects)
          ? project.about.projects.map((item, index) => ({
              ...item,
              year:
                typeof item.year === "string" && item.year ? item.year : "2020",
              order: typeof item.order === "number" ? item.order : index + 1,
            }))
          : initialProject.about.projects,
      }
    : initialProject.about;
  const galleries = [...project.galleries];
  for (const gallery of initialProject.galleries) {
    if (!galleries.some((item) => item.id === gallery.id)) {
      galleries.push(gallery);
    }
  }
  const sections = [...project.sections];
  for (const section of initialProject.sections) {
    if (!sections.some((item) => item.id === section.id)) {
      sections.push(section);
    }
  }

  const pointsOfInterest = (
    project.pointsOfInterest ?? initialProject.pointsOfInterest
  ).map((point, index) => ({
    ...point,
    category:
      String(point.category) === "Cafés"
        ? ("Cafeterías" as const)
        : project.locationMap ? point.category : defaultPointCategory(point),
    visible: typeof point.visible === "boolean" ? point.visible : true,
    order: typeof point.order === "number" ? point.order : index + 1,
  }));

  return {
    ...project,
    adminPin: project.adminPin === "6640" ? initialProject.adminPin : project.adminPin,
    localStatus:
      project.localStatus ??
      (project.lastPublishedSnapshot ? "published-local" : undefined),
    logoSrc,
    about,
    galleries,
    sections,
    pointsOfInterest:
      project.version.version === "1.0" && !project.localStatus
        ? initialProject.pointsOfInterest
        : pointsOfInterest,
  };
}
