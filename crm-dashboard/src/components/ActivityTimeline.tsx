"use client";

import { useState } from "react";
import { Activity, createActivity } from "@/lib/api";

interface ActivityTimelineProps {
  activities: Activity[];
  leadId: string;
  oppId?: string;
  onActivityAdded: () => void;
}

// Activity type icons
const activityIcons: Record<string, string> = {
  Call: "📞",
  Email: "✉️",
  Meeting: "🤝",
  Note: "📝",
  Task: "✅",
};

const activityTypes = ["Call", "Email", "Meeting", "Note", "Task"];

export default function ActivityTimeline({
  activities,
  leadId,
  oppId,
  onActivityAdded,
}: ActivityTimelineProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(),
  );
  const [filterType, setFilterType] = useState<string>("All");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: "Note",
    subject: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter activities by type
  const filteredActivities =
    filterType === "All"
      ? activities
      : activities.filter((a) => a.type === filterType);

  const toggleActivity = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.subject.trim()) return;

    setSubmitting(true);
    try {
      await createActivity({
        lead_id: leadId,
        opp_id: oppId,
        type: newActivity.type,
        subject: newActivity.subject,
        description: newActivity.description,
        created_by: "User",
      });
      setNewActivity({ type: "Note", subject: "", description: "" });
      setShowQuickAdd(false);
      onActivityAdded();
    } catch (err) {
      console.error("Failed to add activity", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filter Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="font-sans font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span>Activity Timeline</span>
          <div className="h-px bg-[var(--border-pencil)] flex-1"></div>
        </h3>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("All")}
          className={`px-3 py-1 font-mono text-[10px] uppercase font-bold border rounded transition-all ${
            filterType === "All"
              ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
              : "bg-white border-[var(--border-pencil)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]"
          }`}
        >
          All
        </button>
        {activityTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 font-mono text-[10px] uppercase font-bold border rounded transition-all flex items-center gap-1 ${
              filterType === type
                ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                : "bg-white border-[var(--border-pencil)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]"
            }`}
          >
            <span>{activityIcons[type]}</span>
            <span>{type}</span>
          </button>
        ))}
      </div>

      {/* Quick Add Toggle Button */}
      {!showQuickAdd && (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="w-full py-3 border-2 border-dashed border-[var(--border-pencil)] rounded font-mono text-sm text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">+</span>
          <span>Quick Add Activity</span>
        </button>
      )}

      {/* Quick Add Form */}
      {showQuickAdd && (
        <div className="border-2 border-[var(--accent-blue)] bg-[var(--bg-paper)] p-4 rounded shadow-md">
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-sans font-bold text-sm text-[var(--text-primary)]">
                Add Activity
              </h4>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase mb-1 text-[var(--text-secondary)]">
                Type
              </label>
              <select
                value={newActivity.type}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, type: e.target.value })
                }
                className="w-full bg-white border border-[var(--border-pencil)] px-3 py-2 font-sans text-sm focus:border-[var(--accent-blue)] focus:outline-none"
              >
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {activityIcons[type]} {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase mb-1 text-[var(--text-secondary)]">
                Subject *
              </label>
              <input
                type="text"
                value={newActivity.subject}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, subject: e.target.value })
                }
                placeholder="Quick summary..."
                className="w-full bg-white border border-[var(--border-pencil)] px-3 py-2 font-sans focus:border-[var(--accent-blue)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase mb-1 text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
                value={newActivity.description}
                onChange={(e) =>
                  setNewActivity({
                    ...newActivity,
                    description: e.target.value,
                  })
                }
                placeholder="Additional details..."
                className="w-full bg-white border border-[var(--border-pencil)] px-3 py-2 font-sans focus:border-[var(--accent-blue)] focus:outline-none resize-y"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-2 font-mono text-xs uppercase hover:underline text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !newActivity.subject.trim()}
                className="btn-primary text-sm"
              >
                {submitting ? "Adding..." : "Add Activity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6 pl-4 border-l-2 border-[var(--border-pencil)] border-dotted ml-2">
        {filteredActivities.length === 0 && (
          <p className="font-sans italic text-[var(--text-muted)] pl-4">
            {filterType === "All"
              ? "No activities recorded yet."
              : `No ${filterType} activities found.`}
          </p>
        )}

        {filteredActivities.map((activity) => {
          const isExpanded = expandedActivities.has(activity.activity_id);
          const hasDescription =
            activity.description && activity.description.trim() !== "";

          return (
            <div key={activity.activity_id} className="relative pl-6">
              {/* Bullet Point with Icon */}
              <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-white border-2 border-[var(--border-pencil)] flex items-center justify-center text-sm">
                {activityIcons[activity.type] || "📌"}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-sans text-[var(--text-primary)] text-base font-medium leading-snug">
                        {activity.subject}
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 border border-[var(--border-pencil)] rounded bg-white text-[var(--text-secondary)]">
                        {activity.type}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {new Date(activity.date).toLocaleString()}
                    </span>
                  </div>
                  {hasDescription && (
                    <button
                      onClick={() => toggleActivity(activity.activity_id)}
                      className="ml-2 px-2 py-1 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                    >
                      {isExpanded ? "▼ Collapse" : "▶ Details"}
                    </button>
                  )}
                </div>

                {/* Collapsible Description */}
                {hasDescription && isExpanded && (
                  <div className="mt-2 p-3 bg-[var(--bg-paper)] border border-[var(--border-pencil)] rounded">
                    <p className="font-sans text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {activity.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
