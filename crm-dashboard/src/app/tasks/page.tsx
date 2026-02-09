"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTask,
  deleteTask,
  getLeads,
  getOpportunities,
  getTasks,
  Task,
  updateTask,
} from "@/lib/api";
import ErrorBoundary from "@/components/ErrorBoundary";

function TasksPageContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<{ lead_id: string; company_name: string }[]>([]);
  const [opportunities, setOpportunities] = useState<{ opp_id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dueFilter, setDueFilter] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    due_date: "",
    lead_id: "",
    opp_id: "",
    assignee: "",
    priority: "Medium",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [tasksRes, leadsRes, oppRes] = await Promise.all([
        getTasks(),
        getLeads(),
        getOpportunities(),
      ]);
      setTasks(tasksRes.tasks);
      setLeads(
        leadsRes.leads.map((lead) => ({
          lead_id: lead.lead_id,
          company_name: lead.company_name,
        })),
      );
      setOpportunities(
        oppRes.opportunities.map((opp) => ({
          opp_id: opp.opp_id,
          title: opp.title,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => (statusFilter ? task.status === statusFilter : true))
      .filter((task) =>
        dueFilter ? (task.due_date || "").slice(0, 10) === dueFilter : true,
      )
      .sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
  }, [tasks, statusFilter, dueFilter]);

  const createTaskEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.lead_id && !formData.opp_id) {
      setError("Link the task to a lead or opportunity.");
      return;
    }

    setSaving(true);
    try {
      await createTask({
        title: formData.title.trim(),
        due_date: formData.due_date || undefined,
        lead_id: formData.lead_id || undefined,
        opp_id: formData.opp_id || undefined,
        assignee: formData.assignee || undefined,
        priority: formData.priority as Task["priority"],
        notes: formData.notes || undefined,
      });
      setFormData({
        title: "",
        due_date: "",
        lead_id: "",
        opp_id: "",
        assignee: "",
        priority: "Medium",
        notes: "",
      });
      await fetchData();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === "Completed" ? "Open" : "Completed";
    try {
      await updateTask(task.task_id, { status: nextStatus });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const removeTask = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="h-10 w-48 bg-[var(--bg-surface)] rounded animate-pulse mb-6"></div>
        <div className="h-40 bg-[var(--bg-surface)] rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="border-b-4 border-[var(--text-primary)] pb-4">
        <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)]">
          Tasks & Reminders
        </h1>
        <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-2">
          {tasks.length} Total Tasks
        </p>
      </div>

      {error && (
        <div className="paper-card p-3 border-red-500 bg-red-50 text-red-700 font-mono text-xs">
          {error}
        </div>
      )}

      <div className="paper-card p-5 bg-white">
        <h2 className="font-sans font-bold text-lg mb-4">Create Task</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={createTaskEntry}>
          <input
            className="px-3 py-2 border border-[var(--border-pencil)] font-sans"
            placeholder="Task title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <input
            className="px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
          />
          <select
            className="px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
            value={formData.priority}
            onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
          >
            <option value="Low">Low priority</option>
            <option value="Medium">Medium priority</option>
            <option value="High">High priority</option>
          </select>
          <select
            className="px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
            value={formData.lead_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, lead_id: e.target.value }))}
          >
            <option value="">Link lead (optional)</option>
            {leads.map((lead) => (
              <option key={lead.lead_id} value={lead.lead_id}>
                {lead.company_name}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
            value={formData.opp_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, opp_id: e.target.value }))}
          >
            <option value="">Link opportunity (optional)</option>
            {opportunities.map((opp) => (
              <option key={opp.opp_id} value={opp.opp_id}>
                {opp.title}
              </option>
            ))}
          </select>
          <input
            className="px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
            placeholder="Assignee email"
            value={formData.assignee}
            onChange={(e) => setFormData((prev) => ({ ...prev, assignee: e.target.value }))}
          />
          <textarea
            className="md:col-span-3 px-3 py-2 border border-[var(--border-pencil)] font-sans"
            rows={3}
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <div className="md:col-span-3 flex justify-end">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>

      <div className="paper-card p-4 bg-[var(--bg-paper)]">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
          >
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <input
            type="date"
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
          />
          <button className="btn-secondary text-xs" onClick={() => {
            setStatusFilter("");
            setDueFilter("");
          }}>
            Reset Filters
          </button>
        </div>
      </div>

      <div className="paper-card overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--bg-paper)] border-b-2 border-[var(--border-ink)]">
            <tr>
              <th className="p-3 font-mono text-xs uppercase border-r border-[var(--border-pencil)]">
                Done
              </th>
              <th className="p-3 font-mono text-xs uppercase border-r border-[var(--border-pencil)]">
                Task
              </th>
              <th className="p-3 font-mono text-xs uppercase border-r border-[var(--border-pencil)]">
                Due
              </th>
              <th className="p-3 font-mono text-xs uppercase border-r border-[var(--border-pencil)]">
                Priority
              </th>
              <th className="p-3 font-mono text-xs uppercase border-r border-[var(--border-pencil)]">
                Assignee
              </th>
              <th className="p-3 font-mono text-xs uppercase text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-pencil)] divide-dashed">
            {filteredTasks.map((task) => (
              <tr key={task.task_id}>
                <td className="p-3 border-r border-[var(--border-pencil)]">
                  <input
                    type="checkbox"
                    checked={task.status === "Completed"}
                    onChange={() => toggleTaskStatus(task)}
                  />
                </td>
                <td className="p-3 border-r border-[var(--border-pencil)]">
                  <p className="font-sans font-semibold text-[var(--text-primary)]">
                    {task.title}
                  </p>
                  {task.notes && (
                    <p className="font-mono text-[10px] text-[var(--text-secondary)] mt-1">
                      {task.notes}
                    </p>
                  )}
                </td>
                <td className="p-3 border-r border-[var(--border-pencil)] font-mono text-xs">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                </td>
                <td className="p-3 border-r border-[var(--border-pencil)]">
                  <span className="font-mono text-xs uppercase">{task.priority}</span>
                </td>
                <td className="p-3 border-r border-[var(--border-pencil)] font-mono text-xs">
                  {task.assignee || "Unassigned"}
                </td>
                <td className="p-3 text-center">
                  <button
                    className="font-mono text-xs text-red-600 hover:underline"
                    onClick={() => removeTask(task.task_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center font-mono text-xs text-[var(--text-secondary)]">
                  No tasks match current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <ErrorBoundary>
      <TasksPageContent />
    </ErrorBoundary>
  );
}
