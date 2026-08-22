import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import projectService from "../services/project.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const Projects = () => {
  const { accessToken } = useAuth();

  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    if (!accessToken) return;
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

  const handleOpenEditModal = (proj) => {
    setEditingProject(proj);
    setFormData({
      title: proj.title,
      description: proj.description || "",
      techStack: Array.isArray(proj.techStack) ? proj.techStack.join(", ") : proj.techStack || "",
      status: proj.status,
      githubUrl: proj.githubUrl || "",
      demoUrl: proj.demoUrl || ""
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      if (editingProject) {
        await projectService.updateProject(accessToken, editingProject._id, formData);
      } else {
        await projectService.createProject(accessToken, formData);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await projectService.deleteProject(accessToken, projectId);
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to delete project.");
    }
  };

  const statusBadges = {
    planned: "bg-slate-800 text-slate-300 border-slate-700",
    in_progress: "bg-indigo-950 text-indigo-300 border-indigo-800",
    completed: "bg-emerald-950 text-emerald-300 border-emerald-800"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Student Projects Portfolio</h1>
          <p className="text-xs text-slate-400 mt-1">Track software projects, tech stacks, and career milestones</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          + Add Project
        </Button>
      </div>

      {error && <ErrorMessage title="Project Operation Error" message={error} onRetry={fetchProjects} />}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        {[
          { label: "All Projects", value: "" },
          { label: "In Progress", value: "in_progress" },
          { label: "Completed", value: "completed" },
          { label: "Planned", value: "planned" }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === tab.value
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects List Container */}
      {isLoading ? (
        <Loader text="Loading project portfolio..." />
      ) : projects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-200">No projects found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add your portfolio projects to link practical experience to your career readiness goals.
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
            + Add First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-100">{proj.title}</h3>
                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border uppercase ${statusBadges[proj.status]}`}>
                    {proj.status.replace("_", " ")}
                  </span>
                </div>
                {proj.description && <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>}

                {/* Tech Stack Tags */}
                {Array.isArray(proj.techStack) && proj.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] font-medium bg-slate-950 text-indigo-300 border border-slate-800 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      GitHub ↗
                    </a>
                  )}
                  {proj.demoUrl && (
                    <a
                      href={proj.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      Demo ↗
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEditModal(proj)} className="text-slate-400 hover:text-slate-200">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteProject(proj._id)} className="text-rose-400 hover:text-rose-300">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Features and problem solved by this project..."
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            />
          </div>

          <Input
            label="Tech Stack (comma-separated)"
            value={formData.techStack}
            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
            placeholder="React, Node.js, Express, MongoDB"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
