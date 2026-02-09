"use client";

import { useEffect, useState } from "react";
import {
  createCustomField,
  deleteCustomField,
  getConfig,
  getCustomFields,
  Config,
  CustomFieldDefinition,
} from "@/lib/api";
import { useSettings } from "@/providers/SettingsProvider";
import { SkeletonBox } from "@/components/SkeletonLoader";

export default function SettingsPage() {
  const { hiddenStages, hiddenStatuses, toggleStage, toggleStatus } =
    useSettings();
  const [config, setConfig] = useState<Config | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [customFieldForm, setCustomFieldForm] = useState({
    entity: "leads",
    key: "",
    label: "",
    field_type: "text",
    required: false,
    options: "",
    validation_rule: "",
  });
  const [customFieldError, setCustomFieldError] = useState<string | null>(null);
  const [customFieldSaving, setCustomFieldSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const [data, fields] = await Promise.all([
          getConfig(),
          getCustomFields(),
        ]);
        setConfig(data);
        setCustomFields(fields.fields);
      } catch (err) {
        console.error("Failed to fetch config for settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const refreshCustomFields = async () => {
    const fields = await getCustomFields();
    setCustomFields(fields.fields);
  };

  const createCustomFieldDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFieldForm.key.trim() || !customFieldForm.label.trim()) {
      setCustomFieldError("Key and label are required.");
      return;
    }

    setCustomFieldSaving(true);
    try {
      await createCustomField({
        entity: customFieldForm.entity as "leads" | "opportunities",
        key: customFieldForm.key.trim(),
        label: customFieldForm.label.trim(),
        field_type: customFieldForm.field_type as CustomFieldDefinition["field_type"],
        required: customFieldForm.required,
        options: customFieldForm.options
          ? customFieldForm.options
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        validation_rule: customFieldForm.validation_rule || undefined,
      });
      setCustomFieldError(null);
      setCustomFieldForm({
        entity: "leads",
        key: "",
        label: "",
        field_type: "text",
        required: false,
        options: "",
        validation_rule: "",
      });
      await refreshCustomFields();
    } catch (err) {
      setCustomFieldError(
        err instanceof Error ? err.message : "Failed to create custom field.",
      );
    } finally {
      setCustomFieldSaving(false);
    }
  };

  const removeCustomField = async (fieldId: string) => {
    if (!window.confirm("Delete this custom field definition?")) return;
    try {
      await deleteCustomField(fieldId);
      await refreshCustomFields();
    } catch (err) {
      setCustomFieldError(
        err instanceof Error ? err.message : "Failed to delete custom field.",
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="h-12 bg-[var(--bg-surface)] rounded w-1/3 mb-8 animate-pulse border-b-4 border-[var(--text-primary)] pb-2"></div>

        <div className="space-y-12">
          {/* Pipeline Settings Skeleton */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <SkeletonBox className="w-6 h-6" />
              <SkeletonBox className="h-8 w-48" />
            </div>
            <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
              <SkeletonBox className="h-4 w-64 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <SkeletonBox key={i} className="h-12" />
                ))}
              </div>
            </div>
          </section>

          {/* Lead Settings Skeleton */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <SkeletonBox className="w-6 h-6" />
              <SkeletonBox className="h-8 w-40" />
            </div>
            <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
              <SkeletonBox className="h-4 w-64 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <SkeletonBox key={i} className="h-12" />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)] mb-8 border-b-4 border-[var(--text-primary)] pb-2">
        Workspace Settings
      </h1>

      <div className="space-y-12">
        {/* Pipeline Settings */}
        <section>
          <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-blue)]">■</span> Pipeline Stages
          </h2>
          <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
            <p className="font-mono text-xs text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
              Select which stages to display on your board
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config?.pipeline_stages.map((stage) => (
                <label
                  key={stage}
                  className="flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] cursor-pointer border border-[var(--border-pencil)] border-dashed rounded transition-colors select-none"
                >
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${!hiddenStages.includes(stage) ? "bg-[var(--text-primary)] border-[var(--text-primary)]" : "border-[var(--text-secondary)] bg-transparent"}`}
                  >
                    {!hiddenStages.includes(stage) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={4}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={!hiddenStages.includes(stage)}
                    onChange={() => toggleStage(stage)}
                  />
                  <span
                    className={`font-sans font-bold ${hiddenStages.includes(stage) ? "text-[var(--text-secondary)] line-through decoration-2" : "text-[var(--text-primary)]"}`}
                  >
                    {stage}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Leads Settings */}
        <section>
          <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-green)]">■</span> Lead Statuses
          </h2>
          <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
            <p className="font-mono text-xs text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
              Select which status tabs to display in the ledger
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config?.lead_statuses.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] cursor-pointer border border-[var(--border-pencil)] border-dashed rounded transition-colors select-none"
                >
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${!hiddenStatuses.includes(status) ? "bg-[var(--text-primary)] border-[var(--text-primary)]" : "border-[var(--text-secondary)] bg-transparent"}`}
                  >
                    {!hiddenStatuses.includes(status) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={4}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={!hiddenStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                  />
                  <span
                    className={`font-sans font-bold ${hiddenStatuses.includes(status) ? "text-[var(--text-secondary)] line-through decoration-2" : "text-[var(--text-primary)]"}`}
                  >
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-red)]">■</span> Custom Fields
          </h2>
          <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] space-y-6">
            <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">
              Define custom fields and validation rules for leads and opportunities.
            </p>

            {customFieldError && (
              <div className="border border-red-500 bg-red-50 text-red-700 p-3 font-mono text-xs">
                {customFieldError}
              </div>
            )}

            <form
              onSubmit={createCustomFieldDefinition}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <select
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                value={customFieldForm.entity}
                onChange={(e) =>
                  setCustomFieldForm((prev) => ({ ...prev, entity: e.target.value }))
                }
              >
                <option value="leads">Leads</option>
                <option value="opportunities">Opportunities</option>
              </select>
              <select
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                value={customFieldForm.field_type}
                onChange={(e) =>
                  setCustomFieldForm((prev) => ({ ...prev, field_type: e.target.value }))
                }
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
                <option value="multi-select">Multi Select</option>
              </select>
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder="Field key (example: territory)"
                value={customFieldForm.key}
                onChange={(e) =>
                  setCustomFieldForm((prev) => ({ ...prev, key: e.target.value }))
                }
              />
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-sans"
                placeholder="Field label"
                value={customFieldForm.label}
                onChange={(e) =>
                  setCustomFieldForm((prev) => ({ ...prev, label: e.target.value }))
                }
              />
              <input
                className="md:col-span-2 px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder="Options (comma-separated for select/multi-select)"
                value={customFieldForm.options}
                onChange={(e) =>
                  setCustomFieldForm((prev) => ({ ...prev, options: e.target.value }))
                }
              />
              <input
                className="md:col-span-2 px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder={"Validation rule (regex for text or min:0,max:100 for number)"}
                value={customFieldForm.validation_rule}
                onChange={(e) =>
                  setCustomFieldForm((prev) => ({ ...prev, validation_rule: e.target.value }))
                }
              />
              <label className="md:col-span-2 flex items-center gap-2 font-mono text-xs">
                <input
                  type="checkbox"
                  checked={customFieldForm.required}
                  onChange={(e) =>
                    setCustomFieldForm((prev) => ({ ...prev, required: e.target.checked }))
                  }
                />
                Required field
              </label>
              <div className="md:col-span-2 flex justify-end">
                <button className="btn-primary" type="submit" disabled={customFieldSaving}>
                  {customFieldSaving ? "Saving..." : "Add Custom Field"}
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {customFields.length === 0 && (
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  No custom fields created yet.
                </p>
              )}
              {customFields.map((field) => (
                <div
                  key={field.field_id}
                  className="border border-[var(--border-pencil)] p-3 bg-[var(--bg-paper)] flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-sans font-bold text-sm">
                      {field.label} <span className="font-mono text-xs">({field.key})</span>
                    </p>
                    <p className="font-mono text-[10px] text-[var(--text-secondary)] uppercase">
                      {field.entity} • {field.field_type} {field.required ? "• required" : ""}
                    </p>
                  </div>
                  <button
                    className="font-mono text-xs text-red-600 hover:underline"
                    onClick={() => removeCustomField(field.field_id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
