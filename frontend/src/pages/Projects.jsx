import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FolderKanban, CheckCircle2, Clock, Code2, Trash2, Plus, ExternalLink, Github, Search, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import projectService from "../services/project.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import { getTechStackTheme } from "../utils/colorSystem";

export const Projects = () => {
  const { accessToken } = useAuth();

  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techStack: "",
    status: "in_progress",
    githubUrl: "",
    demoUrl: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await projectService.getProjects(accessToken, params);
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message || "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      description: "",
      techStack: "",
      status: "in_progress",
      githubUrl: "",
      demoUrl: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || "",
      techStack: Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack || "",
      status: project.status,
      githubUrl: project.githubUrl || "",
      demoUrl: project.demoUrl || ""
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      const payload = {
        ...formData,
        techStack: formData.techStack
          ? formData.techStack.split(",").map((s) => s.trim()).filter(Boolean)
          : []
      };

      if (editingProject) {
        await projectService.updateProject(accessToken, editingProject._id, payload);
      } else {
        await projectService.createProject(accessToken, payload);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await projectService.deleteProject(accessToken, deleteConfirmId);
      setDeleteConfirmId(null);
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to delete project.");
    }
  };

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter((p) => p.status === "in_progress").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const allStacks = new Set();
    projects.forEach((p) => {
      if (Array.isArray(p.techStack)) {
        p.techStack.forEach((t) => allStacks.add(t));
      }
    });
    return {
      total,
      inProgress,
      completed,
      uniqueStacks: allStacks.size
    };
  }, [projects]);

  // Search Filter
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = projectSearch.toLowerCase().trim();
      if (!q) return true;
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchTech = Array.isArray(p.techStack) && p.techStack.some((t) => t?.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchTech;
    });
  }, [projects, projectSearch]);

  const getStatusVariant = (status) => {
    if (status === "completed") return "emerald";
    if (status === "in_progress") return "cyan";
    return "muted";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-cyan-200/60 dark:border-cyan-900/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 overflow-hidden">
        {/* Top Cyan accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-display flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-500" />
              Builds & Craft
            </span>
            <Badge variant="cyan" size="xs">
              Live Verified Work
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white font-display tracking-tight">
            Projects Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-lg">
            Track software engineering builds, multi-tier tech stacks, verified repos, and production deployments.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-500/25"
        >
          <Plus size={16} />
          <span>Add Project</span>
        </Button>
      </div>

      {error && <ErrorMessage title="Project Operation Error" message={error} onRetry={fetchProjects} />}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={kpiStats.total}
          subtext="Portfolio builds"
          color="cyan"
          icon={FolderKanban}
        />
        <StatCard
          label="In Progress"
          value={kpiStats.inProgress}
          subtext="Active sprints"
          color="amber"
          icon={Clock}
        />
        <StatCard
          label="Completed"
          value={kpiStats.completed}
          subtext="Shipped & verified"
          color="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          label="Unique Technologies"
          value={kpiStats.uniqueStacks}
          subtext="Distinct tech skills"
          color="violet"
          icon={Code2}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "All Projects", value: "" },
            { label: "In Progress", value: "in_progress" },
            { label: "Completed", value: "completed" },
            { label: "Planned", value: "planned" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 shrink-0 cursor-pointer select-none active:scale-95 ${
                statusFilter === tab.value
                  ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 shadow-xs"
                  : "text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 border border-transparent hover:border-[#E7EAF0] dark:hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects or tech..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 shadow-xs"
          />
        </div>
      </div>

      {/* Projects List Container */}
      {isLoading ? (
        <Loader text="Loading project portfolio..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Add your portfolio projects to link practical experience to your career readiness goals."
          action={
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add First Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => {
            const statusVariant = getStatusVariant(proj.status);
            return (
              <div
                key={proj._id}
                className="relative p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] hover:border-cyan-500/40 dark:hover:border-cyan-500/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)] group overflow-hidden"
              >
                {/* Left accent bar based on status */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1 ${
                    proj.status === "completed"
                      ? "bg-emerald-500"
                      : proj.status === "in_progress"
                      ? "bg-cyan-500"
                      : "bg-slate-400"
                  }`}
                />

                <div className="space-y-2.5 pl-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 font-display group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {proj.title}
                    </h3>
                    <Badge variant={statusVariant} size="xs" withDot>
                      {proj.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed line-clamp-3">
                      {proj.description}
                    </p>
                  )}

                  {/* Tech Stack Tags */}
                  {Array.isArray(proj.techStack) && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.techStack.map((tech, idx) => {
                        const theme = getTechStackTheme(tech);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-md border transition-all ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            {tech}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E7EAF0] dark:border-[#1F2937] text-xs pl-1.5">
                  <div className="flex items-center gap-2">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-[#E7EAF0] dark:border-slate-700 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-95 flex items-center gap-1.5 font-semibold transition-all duration-150"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a
                        href={proj.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:border-emerald-300 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-95 flex items-center gap-1.5 font-semibold transition-all duration-150"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(proj)}
                      className="px-2.5 py-1 rounded-xl text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 hover:-translate-y-0.5 border border-transparent hover:border-[#E7EAF0] dark:hover:border-slate-700 hover:shadow-2xs active:translate-y-0 active:scale-95 transition-all duration-150 font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(proj._id)}
                      className="px-2.5 py-1 rounded-xl text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:-translate-y-0.5 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 hover:shadow-2xs active:translate-y-0 active:scale-95 transition-all duration-150 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Portfolio Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Project
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#667085] leading-relaxed">
          Are you sure you want to permanently delete this project from your portfolio? This action cannot be undone.
        </p>
      </Modal>

      {/* Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? "Edit Project" : "Add Project"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProject} isLoading={isSaving}>
              {editingProject ? "Save Changes" : "Create Project"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
          <Input
            label="Project Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Real-Time Chat Engine"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this project do and what challenges did it solve?"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 leading-relaxed shadow-xs"
            />
          </div>

          <Input
            label="Tech Stack (comma-separated)"
            value={formData.techStack}
            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
            placeholder="React, TypeScript, WebSocket, Tailwind"
            helperText="Used to evaluate skill proficiency alignment"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GitHub Repository URL"
              value={formData.githubUrl}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              placeholder="https://github.com/..."
            />
            <Input
              label="Live Demo URL"
              value={formData.demoUrl}
              onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
              placeholder="https://myproject.app"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-cyan-500 shadow-xs"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
