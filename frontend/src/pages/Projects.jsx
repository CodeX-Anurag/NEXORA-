import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FolderKanban, CheckCircle2, Clock, Code2, Trash2, Plus, ExternalLink, Github, Search } from "lucide-react";
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

  const handleDeleteProject = (projectId) => {
    setDeleteConfirmId(projectId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || !accessToken) return;

    try {
      await projectService.deleteProject(accessToken, deleteConfirmId);
      setDeleteConfirmId(null);
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to delete project.");
    }
  };

  const kpiStats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const inProgress = projects.filter((p) => p.status === "in_progress").length;
    const allStacks = projects.flatMap((p) =>
      Array.isArray(p.techStack) ? p.techStack : []
    );
    const uniqueStacks = new Set(allStacks).size;
    return { total, completed, inProgress, uniqueStacks };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!projectSearch.trim()) return true;
      const q = projectSearch.toLowerCase().trim();
      const titleMatch = p.title?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      const stackMatch = Array.isArray(p.techStack) && p.techStack.some((s) => s.toLowerCase().includes(q));
      return titleMatch || descMatch || stackMatch;
    });
  }, [projects, projectSearch]);

  const getStatusVariant = (status) => {
    if (status === "completed") return "success";
    if (status === "in_progress") return "primary";
    return "muted";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#191816] border border-[#2D2925]">
        <div>
          <h1 className="text-2xl font-bold text-[#FAF7F2] font-display">Student Projects Portfolio</h1>
          <p className="text-xs text-[#9C9384] mt-1">Track software projects, tech stacks, and career milestones</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          + Add Project
        </Button>
      </div>

      {error && <ErrorMessage title="Project Operation Error" message={error} onRetry={fetchProjects} />}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={kpiStats.total}
          subtext="Portfolio items"
          color="white"
          icon={FolderKanban}
        />
        <StatCard
          label="In Progress"
          value={kpiStats.inProgress}
          subtext="Active development"
          color="terracotta"
          icon={Clock}
        />
        <StatCard
          label="Completed"
          value={kpiStats.completed}
          subtext="Shipped & verified"
          color="sage"
          icon={CheckCircle2}
        />
        <StatCard
          label="Unique Technologies"
          value={kpiStats.uniqueStacks}
          subtext="Tech stack skills"
          color="amber"
          icon={Code2}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#191816] border border-[#2D2925]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "All Projects", value: "" },
            { label: "In Progress", value: "in_progress" },
            { label: "Completed", value: "completed" },
            { label: "Planned", value: "planned" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                statusFilter === tab.value
                  ? "bg-[#E0693B] text-white shadow-sm"
                  : "text-[#9C9384] hover:text-[#FAF7F2] hover:bg-[#22201D]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#787165] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects or tech..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#141312] border border-[#2D2925] rounded-xl text-xs text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B]"
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
          {filteredProjects.map((proj) => (
            <div
              key={proj._id}
              className="p-5 rounded-2xl bg-[#191816] border border-[#2D2925] hover:border-[#3D3832] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-[#FAF7F2] font-display">{proj.title}</h3>
                  <Badge variant={getStatusVariant(proj.status)} size="xs">
                    {proj.status.replace("_", " ")}
                  </Badge>
                </div>
                {proj.description && <p className="text-xs text-[#9C9384] leading-relaxed">{proj.description}</p>}

                {/* Tech Stack Tags */}
                {Array.isArray(proj.techStack) && proj.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] font-mono bg-[#141312] text-[#CDC5B6] border border-[#302C28] rounded-md">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#262420] text-xs">
                <div className="flex items-center gap-3">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E0693B] hover:text-[#EB784B] hover:underline flex items-center gap-1 font-semibold"
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
                      className="text-[#2EA366] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEditModal(proj)} className="text-[#9C9384] hover:text-[#FAF7F2] transition-colors font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteProject(proj._id)} className="text-rose-400 hover:text-rose-300 transition-colors font-medium flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal (Replaces window.confirm) */}
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
        <p className="text-xs text-[#CDC5B6] leading-relaxed">
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
              {editingProject ? "Update Project" : "Create Project"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <Input
            label="Project Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. NEXORA Student Platform"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Features and problem solved by this project..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#141312] border border-[#302C28] rounded-xl text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B] focus:ring-1 focus:ring-[#E0693B] min-h-[80px]"
            />
          </div>

          <Input
            label="Tech Stack (comma-separated)"
            value={formData.techStack}
            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
            placeholder="React, Node.js, Express, MongoDB"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="px-3.5 py-2.5 text-sm bg-[#141312] border border-[#302C28] rounded-xl text-[#FAF7F2] focus:outline-none focus:border-[#E0693B] focus:ring-1 focus:ring-[#E0693B]"
            >
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
            </select>
          </div>

          <Input
            label="GitHub Repository URL (Optional)"
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
            placeholder="https://github.com/username/project"
          />

          <Input
            label="Live Demo URL (Optional)"
            type="url"
            value={formData.demoUrl}
            onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
            placeholder="https://project.vercel.app"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
