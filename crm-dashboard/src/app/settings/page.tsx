"use client";

import { useEffect, useState } from "react";
import {
  connectIntegration,
  createCustomField,
  createEmailTemplate,
  deleteCustomField,
  deleteEmailTemplate,
  getAuditEvents,
  getAllIntegrationRuns,
  getConfig,
  getCustomFields,
  getEmailTemplates,
  getIntegrations,
  renderEmailTemplate,
  updateEmailTemplate,
  AuditLogEvent,
  EmailTemplate,
  IntegrationSyncRun,
  syncIntegration,
  Config,
  CustomFieldDefinition,
  IntegrationConnection,
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
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    entity: "leads",
    subject: "Quick follow up for {{Company}}",
    body: "Hi {{First Name}},\n\nGreat connecting with you at {{Company}}.\n\nBest,\n{{My Name}}",
    owner: "",
    is_shared: true,
  });
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateRenderTarget, setTemplateRenderTarget] = useState({
    lead_id: "",
    opp_id: "",
    my_name: "",
  });
  const [templatePreview, setTemplatePreview] = useState<{
    template_id: string;
    subject: string;
    body: string;
  } | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [integrationProvider, setIntegrationProvider] = useState("google_calendar");
  const [integrationConfig, setIntegrationConfig] = useState("");
  const [integrationSyncKey, setIntegrationSyncKey] = useState("");
  const [integrationRuns, setIntegrationRuns] = useState<IntegrationSyncRun[]>([]);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditLogEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const [data, fields, templatesData, integrationsData, runsData, auditData] = await Promise.all([
          getConfig(),
          getCustomFields(),
          getEmailTemplates(),
          getIntegrations(),
          getAllIntegrationRuns(30),
          getAuditEvents({ limit: 25 }),
        ]);
        setConfig(data);
        setCustomFields(fields.fields);
        setEmailTemplates(templatesData.templates);
        setIntegrations(integrationsData.integrations);
        setIntegrationRuns(runsData.runs);
        setAuditEvents(auditData.events);
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

  const refreshEmailTemplates = async () => {
    const data = await getEmailTemplates();
    setEmailTemplates(data.templates);
  };

  const saveEmailTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name.trim() || !templateForm.subject.trim() || !templateForm.body.trim()) {
      setTemplateError("Name, subject, and body are required.");
      return;
    }

    setTemplateSaving(true);
    try {
      await createEmailTemplate({
        name: templateForm.name.trim(),
        entity: templateForm.entity as "leads" | "opportunities",
        subject: templateForm.subject,
        body: templateForm.body,
        owner: templateForm.owner || undefined,
        is_shared: templateForm.is_shared,
      });
      setTemplateError(null);
      setTemplateForm({
        name: "",
        entity: "leads",
        subject: "Quick follow up for {{Company}}",
        body: "Hi {{First Name}},\n\nGreat connecting with you at {{Company}}.\n\nBest,\n{{My Name}}",
        owner: "",
        is_shared: true,
      });
      await refreshEmailTemplates();
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "Failed to save email template.",
      );
    } finally {
      setTemplateSaving(false);
    }
  };

  const toggleTemplateSharing = async (template: EmailTemplate) => {
    try {
      await updateEmailTemplate(template.template_id, {
        is_shared: !template.is_shared,
      });
      await refreshEmailTemplates();
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "Failed to update template.",
      );
    }
  };

  const removeTemplate = async (templateId: string) => {
    if (!window.confirm("Delete this email template?")) return;
    try {
      await deleteEmailTemplate(templateId);
      if (templatePreview?.template_id === templateId) {
        setTemplatePreview(null);
      }
      await refreshEmailTemplates();
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "Failed to delete template.",
      );
    }
  };

  const previewTemplate = async (templateId: string) => {
    try {
      const rendered = await renderEmailTemplate(templateId, {
        lead_id: templateRenderTarget.lead_id || undefined,
        opp_id: templateRenderTarget.opp_id || undefined,
        my_name: templateRenderTarget.my_name || undefined,
      });
      setTemplatePreview(rendered);
      setTemplateError(null);
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "Failed to render template.",
      );
    }
  };

  const copyTemplateToClipboard = async () => {
    if (!templatePreview) return;
    const payload = `Subject: ${templatePreview.subject}\n\n${templatePreview.body}`;
    await navigator.clipboard.writeText(payload);
  };

  const refreshIntegrations = async () => {
    const [connections, runs, audit] = await Promise.all([
      getIntegrations(),
      getAllIntegrationRuns(30),
      getAuditEvents({ limit: 25 }),
    ]);
    setIntegrations(connections.integrations);
    setIntegrationRuns(runs.runs);
    setAuditEvents(audit.events);
  };

  const connectProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntegrationSaving(true);
    try {
      const parsedConfig = integrationConfig.trim()
        ? (JSON.parse(integrationConfig) as Record<string, unknown>)
        : {};
      await connectIntegration(integrationProvider, parsedConfig);
      setIntegrationError(null);
      setIntegrationConfig("");
      await refreshIntegrations();
    } catch (err) {
      setIntegrationError(
        err instanceof Error
          ? err.message
          : "Failed to connect integration. Use valid JSON config.",
      );
    } finally {
      setIntegrationSaving(false);
    }
  };

  const runProviderSync = async (provider: string) => {
    setIntegrationSaving(true);
    try {
      await syncIntegration(provider, {
        idempotency_key: integrationSyncKey || undefined,
        max_retries: 1,
      });
      await refreshIntegrations();
      setIntegrationError(null);
      setIntegrationSyncKey("");
    } catch (err) {
      setIntegrationError(
        err instanceof Error ? err.message : "Failed to sync integration.",
      );
    } finally {
      setIntegrationSaving(false);
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

        <section>
          <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-yellow)]">■</span> Email Templates
          </h2>
          <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] space-y-5">
            <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">
              Create reusable templates with variables: {"{{First Name}}"}, {"{{Company}}"}, {"{{My Name}}"}, {"{{Opportunity}}"}.
            </p>

            {templateError && (
              <div className="border border-red-500 bg-red-50 text-red-700 p-3 font-mono text-xs">
                {templateError}
              </div>
            )}

            <form onSubmit={saveEmailTemplate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-sans"
                placeholder="Template name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <select
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                value={templateForm.entity}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, entity: e.target.value }))}
              >
                <option value="leads">Leads</option>
                <option value="opportunities">Opportunities</option>
              </select>
              <input
                className="md:col-span-2 px-3 py-2 border border-[var(--border-pencil)] bg-white font-sans"
                placeholder="Subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
              <textarea
                className="md:col-span-2 px-3 py-2 border border-[var(--border-pencil)] bg-white font-sans"
                rows={4}
                placeholder="Body"
                value={templateForm.body}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, body: e.target.value }))}
              />
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder="Owner email (optional)"
                value={templateForm.owner}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, owner: e.target.value }))}
              />
              <label className="flex items-center gap-2 font-mono text-xs">
                <input
                  type="checkbox"
                  checked={templateForm.is_shared}
                  onChange={(e) => setTemplateForm((prev) => ({ ...prev, is_shared: e.target.checked }))}
                />
                Shared template
              </label>
              <div className="md:col-span-2 flex justify-end">
                <button className="btn-primary" type="submit" disabled={templateSaving}>
                  {templateSaving ? "Saving..." : "Add Template"}
                </button>
              </div>
            </form>

            <div className="border-t border-[var(--border-pencil)] pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder="Lead ID for preview (optional)"
                value={templateRenderTarget.lead_id}
                onChange={(e) => setTemplateRenderTarget((prev) => ({ ...prev, lead_id: e.target.value }))}
              />
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder="Opportunity ID (optional)"
                value={templateRenderTarget.opp_id}
                onChange={(e) => setTemplateRenderTarget((prev) => ({ ...prev, opp_id: e.target.value }))}
              />
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder="My Name override (optional)"
                value={templateRenderTarget.my_name}
                onChange={(e) => setTemplateRenderTarget((prev) => ({ ...prev, my_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              {emailTemplates.length === 0 && (
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  No email templates yet.
                </p>
              )}
              {emailTemplates.map((template) => (
                <div
                  key={template.template_id}
                  className="border border-[var(--border-pencil)] p-3 bg-[var(--bg-paper)] space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-sans font-bold text-sm">{template.name}</p>
                      <p className="font-mono text-[10px] text-[var(--text-secondary)] uppercase">
                        {template.entity} • {template.is_shared ? "shared" : "private"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => previewTemplate(template.template_id)}
                      >
                        Preview
                      </button>
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => toggleTemplateSharing(template)}
                      >
                        {template.is_shared ? "Make Private" : "Make Shared"}
                      </button>
                      <button
                        className="font-mono text-xs text-red-600 hover:underline"
                        onClick={() => removeTemplate(template.template_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                    Subject: {template.subject}
                  </p>
                </div>
              ))}
            </div>

            {templatePreview && (
              <div className="border border-[var(--border-pencil)] bg-white p-3 space-y-2">
                <p className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                  Preview
                </p>
                <p className="font-sans text-sm">
                  <span className="font-bold">Subject:</span> {templatePreview.subject}
                </p>
                <pre className="font-sans whitespace-pre-wrap text-sm bg-[var(--bg-paper)] border border-[var(--border-pencil)] p-2">
                  {templatePreview.body}
                </pre>
                <div className="flex justify-end">
                  <button className="btn-primary text-xs" onClick={copyTemplateToClipboard}>
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-blue)]">■</span> Integrations
          </h2>
          <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] space-y-5">
            <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">
              Connect providers and run manual sync.
            </p>

            {integrationError && (
              <div className="border border-red-500 bg-red-50 text-red-700 p-3 font-mono text-xs">
                {integrationError}
              </div>
            )}

            <form onSubmit={connectProvider} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={integrationProvider}
                  onChange={(e) => setIntegrationProvider(e.target.value)}
                  className="px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                >
                  <option value="google_calendar">Google Calendar</option>
                  <option value="gmail">Gmail</option>
                  <option value="slack">Slack</option>
                </select>
                <button className="btn-primary" type="submit" disabled={integrationSaving}>
                  {integrationSaving ? "Saving..." : "Connect Provider"}
                </button>
              </div>
              <textarea
                className="w-full px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                rows={3}
                placeholder={"Optional JSON config, e.g. {\"webhook_url\":\"https://...\"}"}
                value={integrationConfig}
                onChange={(e) => setIntegrationConfig(e.target.value)}
              />
              <input
                className="w-full px-3 py-2 border border-[var(--border-pencil)] bg-white font-mono text-xs"
                placeholder="Optional idempotency key for next sync run"
                value={integrationSyncKey}
                onChange={(e) => setIntegrationSyncKey(e.target.value)}
              />
            </form>

            <div className="space-y-2">
              {integrations.length === 0 && (
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  No integrations connected yet.
                </p>
              )}
              {integrations.map((integration) => (
                <div
                  key={integration.integration_id}
                  className="border border-[var(--border-pencil)] p-3 bg-[var(--bg-paper)] flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-sans font-bold text-sm">{integration.provider}</p>
                    <p className="font-mono text-[10px] text-[var(--text-secondary)] uppercase">
                      {integration.status}
                      {integration.last_sync_at
                        ? ` • last sync ${new Date(integration.last_sync_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => runProviderSync(integration.provider)}
                    disabled={integrationSaving}
                  >
                    Sync
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--border-pencil)]">
              <p className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                Recent Sync Runs
              </p>
              {integrationRuns.length === 0 && (
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  No sync runs recorded yet.
                </p>
              )}
              {integrationRuns.slice(0, 10).map((run) => (
                <div
                  key={run.run_id}
                  className="border border-[var(--border-pencil)] p-2 bg-white flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-mono text-[10px] uppercase">
                      {run.provider} • {run.status}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                      retries {run.retry_count} • records {run.synced_records}
                      {run.idempotency_key ? ` • key ${run.idempotency_key}` : ""}
                      {run.error ? ` • error ${run.error}` : ""}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                    {new Date(run.started_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-red)]">■</span> Audit Trail
          </h2>
          <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] space-y-2">
            {auditEvents.length === 0 && (
              <p className="font-mono text-xs text-[var(--text-secondary)]">
                No audit events yet.
              </p>
            )}
            {auditEvents.slice(0, 15).map((event) => (
              <div
                key={event.event_id}
                className="border border-[var(--border-pencil)] p-2 bg-[var(--bg-paper)] flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase">
                    {event.action} • {event.entity} • {event.status}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                    {event.record_id ? `record ${event.record_id} • ` : ""}
                    {Object.keys(event.metadata || {}).length > 0
                      ? JSON.stringify(event.metadata)
                      : "no metadata"}
                  </p>
                </div>
                <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
