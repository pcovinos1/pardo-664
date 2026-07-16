import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProject, saveProject } from "../services/db";
import type { Project } from "../types/project";

interface ProjectContextValue {
  project: Project | null;
  loading: boolean;
  updateProject: (updater: Project | ((project: Project) => Project)) => Promise<void>;
  reload: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await getProject();
    setProject(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateProject = useCallback(async (updater: Project | ((project: Project) => Project)) => {
    setProject((current) => {
      if (!current) return current;
      const next = typeof updater === "function" ? updater(current) : updater;
      void saveProject(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ project, loading, updateProject, reload }), [project, loading, updateProject, reload]);
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject debe usarse dentro de ProjectProvider");
  return ctx;
}
