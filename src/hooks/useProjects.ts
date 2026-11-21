"use client";

import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { deleteProjectById, listProjects, saveProject } from "@/lib/storage";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const items = await listProjects();
    setProjects(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsertProject = useCallback(async (project: Project) => {
    const updated: Project = { ...project, updatedAt: Date.now() };
    await saveProject(updated);
    setProjects((prev) => {
      const rest = prev.filter((p) => p.id !== updated.id);
      return [updated, ...rest];
    });
    return updated;
  }, []);

  const renameProject = useCallback(async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProjects((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      const updated = { ...target, name: trimmed, updatedAt: Date.now() };
      saveProject(updated);
      return prev.map((p) => (p.id === id ? updated : p));
    });
  }, []);

  const removeProject = useCallback(async (id: string) => {
    await deleteProjectById(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    projects,
    loading,
    upsertProject,
    renameProject,
    removeProject,
    refresh,
  };
}
