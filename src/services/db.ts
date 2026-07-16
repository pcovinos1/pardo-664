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
  if (saved) return saved as Project;
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
