import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getProject,
  saveProject,
  normalizeProject,
  backupProject,
} from "../services/db";
import { fetchRemoteProject } from "../services/files";
import type { Project } from "../types/project";

interface ProjectContextValue {
  project: Project | null;
  loading: boolean;
  updateProject: (
    updater: Project | ((project: Project) => Project),
  ) => Promise<void>;
  reload: () => Promise<void>;
  syncFromRemote: () => Promise<Project | null>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const latest = useRef<Project | null>(null);
  const pending = useRef(false);
  const reload = useCallback(async () => {
    const next = await getProject();
    latest.current = next;
    setProject(next);
    setLoading(false);
  }, []);

  const updateProject = useCallback(
    async (updater: Project | ((project: Project) => Project)) => {
      const current = latest.current;
      if (!current) return;
      const next = typeof updater === "function" ? updater(current) : updater;
      pending.current = true;
      try {
        await saveProject(next);
        latest.current = next;
        setProject(next);
      } finally {
        pending.current = false;
      }
    },
    [],
  );

  const syncFromRemote = useCallback(
    async (automatic = false) => {
      const current = latest.current;
      const editing = () =>
        document.documentElement.dataset.pardoEditing === "true";
      if (
        !current ||
        pending.current ||
        (automatic &&
          (editing() ||
            current.localStatus === "local" ||
            current.localStatus === "published-local"))
      )
        return null;
      const remote = await fetchRemoteProject(current);
      if (
        !remote ||
        latest.current !== current ||
        pending.current ||
        (automatic && editing())
      )
        return null;
      if (automatic) {
        const remoteIds = new Set(remote.typologies.map((item) => item.id));
        if (current.typologies.some((item) => !remoteIds.has(item.id)))
          return null;
        if (!current.localStatus) await backupProject(current);
        if (latest.current !== current || pending.current || editing())
          return null;
      }
      const next: Project = {
        ...normalizeProject(remote),
        localStatus: "github",
      };
      await updateProject(next);
      return next;
    },
    [updateProject],
  );

  useEffect(() => {
    void reload()
      .then(() => syncFromRemote(true))
      .catch(() => setLoading(false));
  }, [reload, syncFromRemote]);

  useEffect(() => {
    const syncWhenOnline = () => {
      if (navigator.onLine) void syncFromRemote(true).catch(() => undefined);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") syncWhenOnline();
    };
    const interval = window.setInterval(syncWhenOnline, 60_000);
    window.addEventListener("online", syncWhenOnline);
    window.addEventListener("focus", syncWhenOnline);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", syncWhenOnline);
      window.removeEventListener("focus", syncWhenOnline);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [syncFromRemote]);

  const value = useMemo(
    () => ({ project, loading, updateProject, reload, syncFromRemote }),
    [project, loading, updateProject, reload, syncFromRemote],
  );
  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject debe usarse dentro de ProjectProvider");
  return ctx;
}
