import { openDB } from "idb";
import type { Project } from "../types/project";
import { initialProject } from "../data/initialProject";

const DB_NAME = "pardo-664-local";
const STORE = "project";
const PROJECT_KEY = "active";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE);
  }
});

export async function getProject(): Promise<Project> {
  const db = await dbPromise;
  const saved = await db.get(STORE, PROJECT_KEY);
  if (saved) {
    const normalized = normalizeProject(saved as Project);
    await db.put(STORE, normalized, PROJECT_KEY);
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
  const db = await dbPromise;
  await db.put(STORE, initialProject, PROJECT_KEY);
  return initialProject;
}

function normalizeProject(project: Project): Project {
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

  const pointsOfInterest = project.pointsOfInterest
    .map((point, index) => ({
      ...point,
      visible: typeof point.visible === "boolean" ? point.visible : true,
      order: typeof point.order === "number" ? point.order : index + 1
    }))
    .sort((a, b) => a.order - b.order);

  return { ...project, galleries, sections, pointsOfInterest };
}
