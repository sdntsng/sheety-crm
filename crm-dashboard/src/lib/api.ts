import { getSession, signOut } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8026";

// Custom error class for authentication failures
export class AuthError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

// Custom error class for rate limit failures
export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number = 60) {
    super(`Rate limited. Please try again in ${retryAfter} seconds.`);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export interface Lead {
  lead_id: string;
  company_name: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  status: string;
  source: string;
  industry?: string;
  company_size?: string;
  notes?: string;
  website?: string;
  linkedin_url?: string;
  logo_url?: string;
  enrichment_status?: string;
  score?: number;
  heat_level?: string;
  created_at: string;
  updated_at: string;
  owner?: string;
  custom_fields?: Record<string, unknown>;
}

export interface Opportunity {
  opp_id: string;
  lead_id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  expected_value: number;
  close_date?: string;
  product?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  owner?: string;
  custom_fields?: Record<string, unknown>;
  lead?: Lead;
}

export interface Activity {
  activity_id: string;
  lead_id: string;
  opp_id?: string;
  type: string;
  subject: string;
  description?: string;
  date: string;
  created_by?: string;
}

export interface Task {
  task_id: string;
  title: string;
  due_date?: string;
  status: "Open" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  lead_id?: string;
  opp_id?: string;
  assignee?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SavedView {
  view_id: string;
  name: string;
  entity: string;
  filters: Record<string, unknown>[];
  sort_by?: string;
  sort_order: "asc" | "desc";
  owner?: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldDefinition {
  field_id: string;
  entity: "leads" | "opportunities";
  key: string;
  label: string;
  field_type: "text" | "number" | "date" | "select" | "multi-select";
  required: boolean;
  options: string[];
  validation_rule?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConnection {
  integration_id: string;
  provider: string;
  status: string;
  config: Record<string, unknown>;
  last_sync_at?: string;
  updated_at: string;
}

export interface IntegrationSyncRun {
  run_id: string;
  provider: string;
  idempotency_key?: string;
  status: "running" | "succeeded" | "failed";
  retry_count: number;
  synced_records: number;
  error?: string;
  started_at: string;
  finished_at?: string;
}

export interface AuditLogEvent {
  event_id: string;
  action: string;
  entity: string;
  record_id?: string;
  status: string;
  actor?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardData {
  total_leads: number;
  total_opportunities: number;
  total_pipeline_value: number;
  total_expected_value: number;
  closed_won_value: number;
  cash_in_bank: number;
  pipeline_by_stage: Record<
    string,
    { count: number; total_value: number; expected_value: number }
  >;
  leads_by_status: Record<string, number>;
}

export interface ReportsData {
  summary: {
    opportunity_count: number;
    pipeline_value: number;
    expected_value: number;
    closed_won_count: number;
    closed_won_value: number;
    closed_lost_count: number;
    closed_lost_value: number;
    activity_count: number;
  };
  by_stage: Record<
    string,
    { count: number; total_value: number; expected_value: number }
  >;
  activity_by_type: Record<string, number>;
  range: { start_date?: string; end_date?: string };
}

// Enum for stages matches backend
export enum PipelineStageEnum {
  PROSPECTING = "Prospecting",
  DISCOVERY = "Discovery",
  PROPOSAL = "Proposal",
  NEGOTIATION = "Negotiation",
  CLOSED_WON = "Closed Won",
  CLOSED_LOST = "Closed Lost",
  DELIVERY = "Delivery",
  INVOICING = "Invoicing",
  CASH_IN_BANK = "Cash in Bank",
}

export interface PipelineStage {
  stage: string;
  opportunities: Opportunity[];
  count: number;
  total_value: number;
}

export interface PipelineData {
  pipeline: Record<string, PipelineStage>;
  stages: string[];
}

export interface Config {
  pipeline_stages: string[];

  lead_statuses: string[];
  lead_sources: string[];
  activity_types: string[];
  company_sizes: string[];
}

// Helper for handling fetch responses with auth and rate limit detection
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    console.error("[API] 401 Unauthorized - signing out");
    if (typeof window !== "undefined") {
      await signOut({ callbackUrl: "/login" });
    }
    throw new AuthError("Session expired. Please sign in again.");
  }

  // Handle 429 Rate Limit
  if (response.status === 429) {
    const retryAfter = parseInt(
      response.headers.get("Retry-After") || "60",
      10,
    );
    throw new RateLimitError(retryAfter);
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || "Request failed");
  }
  return response.json();
}

async function handleNonJsonResponse(response: Response): Promise<Response> {
  if (response.status === 401) {
    console.error("[API] 401 Unauthorized - signing out");
    if (typeof window !== "undefined") {
      await signOut({ callbackUrl: "/login" });
    }
    throw new AuthError("Session expired. Please sign in again.");
  }

  if (response.status === 429) {
    const retryAfter = parseInt(
      response.headers.get("Retry-After") || "60",
      10,
    );
    throw new RateLimitError(retryAfter);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed");
  }

  return response;
}

// Helper for authenticated requests with session error detection
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

  if (typeof window !== "undefined") {
    const session = await getSession();
    const sheetId = localStorage.getItem("selected_sheet_id");
    if (sheetId) {
      headers["x-sheet-id"] = sheetId;
    }

    // Check if session exists at all
    if (!session || !session.user) {
      if (isMockMode) {
        headers["Authorization"] = "Bearer mock_token_xyz";
        return fetch(url, { ...options, headers });
      }
      console.error("[API] No active session - redirecting to login");
      await signOut({ callbackUrl: "/login" });
      throw new AuthError("Authentication required. Please sign in.");
    }

    // Check if session has a refresh error - sign out if so
    // @ts-expect-error - session may have an error property at runtime that's not in the type
    if (session?.error === "RefreshAccessTokenError") {
      console.error("[API] Refresh token error detected - signing out");
      await signOut({ callbackUrl: "/login" });
      throw new AuthError("Session expired. Please sign in again.");
    }

    // @ts-expect-error - session may have an accessToken property at runtime that's not in the type
    if (session?.accessToken) {
      // @ts-expect-error - session may have an accessToken property at runtime that's not in the type
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    } else {
      if (isMockMode) {
        headers["Authorization"] = "Bearer mock_token_xyz";
        return fetch(url, { ...options, headers });
      }
      // No access token available despite session??
      console.warn("[API] Session exists but no access token found");
      throw new AuthError("Invalid session configuration.");
    }
  }

  return fetch(url, { ...options, headers });
}

// ============================================================================
// Dashboard & Config
// ============================================================================

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetchWithAuth(`${API_BASE}/api/dashboard`);
  return handleResponse(response);
}

export async function getReports(
  startDate?: string,
  endDate?: string,
): Promise<ReportsData> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const response = await fetchWithAuth(`${API_BASE}/api/reports?${params}`);
  return handleResponse(response);
}

export async function getPipeline(): Promise<PipelineData> {
  const response = await fetchWithAuth(`${API_BASE}/api/pipeline`);
  return handleResponse(response);
}

export async function getConfig(): Promise<Config> {
  const response = await fetchWithAuth(`${API_BASE}/api/config`);
  return handleResponse(response);
}

export async function getSheets(): Promise<{
  sheets: { id: string; name: string }[];
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/sheets`);
  return handleResponse(response);
}

export async function createSheet(name: string): Promise<{
  success: boolean;
  sheet: { id: string; name: string; url: string };
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/sheets/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
}

export async function addSchemaToSheet(
  sheetId: string,
): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/sheets/${sheetId}/schema`,
    {
      method: "POST",
    },
  );
  return handleResponse(response);
}

// ============================================================================
// Leads
// ============================================================================

// Converted to fetchWithAuth via sed/multi-replace logic not fully applicable for all lines at once,
// but simpler effectively replacing distinct blocks.

// Leads
export async function getLeads(
  status?: string,
  source?: string,
  owner?: string,
): Promise<{ leads: Lead[]; count: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (source) params.set("source", source);
  if (owner) params.set("owner", owner);
  const response = await fetchWithAuth(`${API_BASE}/api/leads?${params}`);
  return handleResponse(response);
}

export async function getLead(leadId: string): Promise<Lead> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads/${leadId}`);
  return handleResponse(response);
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateLead(
  leadId: string,
  data: Partial<Lead>,
): Promise<Lead> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads/${leadId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteLead(leadId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads/${leadId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

// Opportunities
export async function getOpportunities(
  stage?: string,
  leadId?: string,
  owner?: string,
): Promise<{ opportunities: Opportunity[]; count: number }> {
  const params = new URLSearchParams();
  if (stage) params.set("stage", stage);
  if (leadId) params.set("lead_id", leadId);
  if (owner) params.set("owner", owner);
  const response = await fetchWithAuth(
    `${API_BASE}/api/opportunities?${params}`,
  );
  return handleResponse(response);
}

export async function getOpportunity(oppId: string): Promise<Opportunity> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/opportunities/${oppId}`,
  );
  return handleResponse(response);
}

export interface OpportunityAnalysis {
  opp_id: string;
  risk_score: number;
  risk_level: "Low" | "Medium" | "High";
  risk_reason: string;
  next_best_action: string;
  metrics: {
    age_days: number;
    days_since_last_activity: number;
    activity_count: number;
  };
}

export async function getOpportunityAnalysis(
  oppId: string,
): Promise<OpportunityAnalysis> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/opportunities/${oppId}/analysis`,
  );
  return handleResponse(response);
}

export async function createOpportunity(
  data: Partial<Opportunity>,
): Promise<Opportunity> {
  const response = await fetchWithAuth(`${API_BASE}/api/opportunities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateOpportunity(
  oppId: string,
  data: Partial<Opportunity>,
): Promise<Opportunity> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/opportunities/${oppId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  return handleResponse(response);
}

export async function updateOpportunityStage(
  oppId: string,
  stage: string,
): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/opportunities/${oppId}/stage`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    },
  );
  return handleResponse(response);
}

export async function deleteOpportunity(oppId: string): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/opportunities/${oppId}`,
    { method: "DELETE" },
  );
  return handleResponse(response);
}

// Activities
export async function getActivities(
  leadId?: string,
  oppId?: string,
): Promise<{ activities: Activity[]; count: number }> {
  const params = new URLSearchParams();
  if (leadId) params.set("lead_id", leadId);
  if (oppId) params.set("opp_id", oppId);
  const response = await fetchWithAuth(`${API_BASE}/api/activities?${params}`);
  return handleResponse(response);
}

export async function createActivity(
  data: Partial<Activity>,
): Promise<Activity> {
  const response = await fetchWithAuth(`${API_BASE}/api/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// Tasks
export async function getTasks(filters?: {
  status?: string;
  due_before?: string;
  assignee?: string;
  lead_id?: string;
  opp_id?: string;
}): Promise<{ tasks: Task[]; count: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.due_before) params.set("due_before", filters.due_before);
  if (filters?.assignee) params.set("assignee", filters.assignee);
  if (filters?.lead_id) params.set("lead_id", filters.lead_id);
  if (filters?.opp_id) params.set("opp_id", filters.opp_id);

  const response = await fetchWithAuth(`${API_BASE}/api/tasks?${params}`);
  return handleResponse(response);
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  const response = await fetchWithAuth(`${API_BASE}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateTask(
  taskId: string,
  data: Partial<Task>,
): Promise<Task> {
  const response = await fetchWithAuth(`${API_BASE}/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/api/tasks/${taskId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

// Saved Views
export async function getSavedViews(filters?: {
  entity?: string;
  owner?: string;
}): Promise<{ views: SavedView[]; count: number }> {
  const params = new URLSearchParams();
  if (filters?.entity) params.set("entity", filters.entity);
  if (filters?.owner) params.set("owner", filters.owner);

  const response = await fetchWithAuth(`${API_BASE}/api/views?${params}`);
  return handleResponse(response);
}

export async function createSavedView(
  data: Partial<SavedView>,
): Promise<SavedView> {
  const response = await fetchWithAuth(`${API_BASE}/api/views`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateSavedView(
  viewId: string,
  data: Partial<SavedView>,
): Promise<SavedView> {
  const response = await fetchWithAuth(`${API_BASE}/api/views/${viewId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteSavedView(viewId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/api/views/${viewId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

// Custom Fields
export async function getCustomFields(entity?: "leads" | "opportunities"): Promise<{
  fields: CustomFieldDefinition[];
  count: number;
}> {
  const params = new URLSearchParams();
  if (entity) params.set("entity", entity);
  const response = await fetchWithAuth(`${API_BASE}/api/custom-fields?${params}`);
  return handleResponse(response);
}

export async function createCustomField(
  payload: Partial<CustomFieldDefinition>,
): Promise<CustomFieldDefinition> {
  const response = await fetchWithAuth(`${API_BASE}/api/custom-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateCustomField(
  fieldId: string,
  payload: Partial<CustomFieldDefinition>,
): Promise<CustomFieldDefinition> {
  const response = await fetchWithAuth(`${API_BASE}/api/custom-fields/${fieldId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteCustomField(fieldId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/api/custom-fields/${fieldId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function getIntegrations(): Promise<{
  integrations: IntegrationConnection[];
  count: number;
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/integrations`);
  return handleResponse(response);
}

export async function connectIntegration(
  provider: string,
  config: Record<string, unknown>,
): Promise<IntegrationConnection> {
  const response = await fetchWithAuth(`${API_BASE}/api/integrations/${provider}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });
  return handleResponse(response);
}

export async function syncIntegration(
  provider: string,
  payload?: { idempotency_key?: string; max_retries?: number },
): Promise<{
  provider: string;
  synced_records: number;
  last_sync_at: string;
  deduplicated: boolean;
  run: IntegrationSyncRun;
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/integrations/${provider}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return handleResponse(response);
}

export async function getIntegrationRuns(provider: string, limit: number = 20): Promise<{
  runs: IntegrationSyncRun[];
  count: number;
}> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/integrations/${provider}/runs?limit=${limit}`,
  );
  return handleResponse(response);
}

export async function getAllIntegrationRuns(limit: number = 50): Promise<{
  runs: IntegrationSyncRun[];
  count: number;
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/integrations/runs?limit=${limit}`);
  return handleResponse(response);
}

export async function getAuditEvents(params?: {
  limit?: number;
  action?: string;
  entity?: string;
}): Promise<{ events: AuditLogEvent[]; count: number }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.action) query.set("action", params.action);
  if (params?.entity) query.set("entity", params.entity);
  const response = await fetchWithAuth(`${API_BASE}/api/audit?${query}`);
  return handleResponse(response);
}

export async function exportEntityCSV(
  entity: "leads" | "opportunities" | "activities" | "tasks",
): Promise<Blob> {
  const response = await fetchWithAuth(`${API_BASE}/api/export/${entity}`);
  const verified = await handleNonJsonResponse(response);
  return verified.blob();
}

export async function bulkOperate(
  entity: "leads" | "opportunities",
  payload: {
    operation: "update_status" | "update_stage" | "delete";
    ids: string[];
    status?: string;
    stage?: string;
  },
): Promise<{ requested: number; updated?: number; deleted?: number; failed_ids: string[] }> {
  const response = await fetchWithAuth(`${API_BASE}/api/bulk/${entity}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// ============================================================================
// Search
// ============================================================================

export interface SearchResults {
  query: string;
  results: {
    leads: (Lead & { type: "lead" })[];
    opportunities: (Opportunity & { type: "opportunity"; lead?: Lead })[];
  };
  total: number;
}

export interface DuplicateLeadMatch {
  confidence: number;
  reasons: string[];
  lead_a: Lead;
  lead_b: Lead;
}

export interface DuplicateMergeSuggestion {
  lead_a_id: string;
  lead_b_id: string;
  primary_lead_id: string;
  secondary_lead_id: string;
  confidence: number;
  field_resolution: Record<
    string,
    {
      lead_a: unknown;
      lead_b: unknown;
      suggested: unknown;
      conflict: boolean;
    }
  >;
  conflicts: string[];
  merged_preview: Record<string, unknown>;
}

export interface AIParseResult {
  intent: "query" | "action" | "insight" | "navigation";
  operation: Record<string, unknown>;
  confirmation_needed: boolean;
  response: string;
}

export async function search(query: string): Promise<SearchResults> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/search?q=${encodeURIComponent(query)}`,
  );
  return handleResponse(response);
}

export async function detectLeadDuplicates(
  minConfidence: number = 0.75,
): Promise<{ matches: DuplicateLeadMatch[]; count: number }> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/leads/duplicates?min_confidence=${minConfidence}`,
  );
  return handleResponse(response);
}

export async function suggestDuplicateMerge(
  leadAId: string,
  leadBId: string,
): Promise<DuplicateMergeSuggestion> {
  const params = new URLSearchParams({
    lead_a_id: leadAId,
    lead_b_id: leadBId,
  });
  const response = await fetchWithAuth(`${API_BASE}/api/leads/duplicates/suggest?${params}`);
  return handleResponse(response);
}

export async function mergeDuplicateLeads(payload: {
  lead_a_id: string;
  lead_b_id: string;
  primary_id?: string;
  selected_fields?: Record<string, unknown>;
}): Promise<{
  merged: boolean;
  primary_lead_id: string;
  secondary_lead_id: string;
  moved: { opportunities: number; tasks: number; activities: number };
  conflicts_resolved: string[];
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads/duplicates/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function parseAIQuery(query: string): Promise<AIParseResult> {
  const response = await fetchWithAuth(`${API_BASE}/api/ai/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return handleResponse(response);
}

export async function executeAIOperation(
  operation: Record<string, unknown>,
): Promise<{ success: boolean; operation: string; result: unknown }> {
  const response = await fetchWithAuth(`${API_BASE}/api/ai/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation }),
  });
  return handleResponse(response);
}

export async function explainAITopic(topic: string): Promise<{
  topic: string;
  explanation: string;
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  return handleResponse(response);
}

export async function getAISuggestions(): Promise<{ suggestions: string[] }> {
  const response = await fetchWithAuth(`${API_BASE}/api/ai/suggest`);
  return handleResponse(response);
}

export async function parseMeetingNotes(payload: {
  content: string;
  lead_id?: string;
  opp_id?: string;
}): Promise<{
  summary: string;
  sentiment: string;
  tasks: Record<string, unknown>[];
  deal_updates: Record<string, unknown>;
  key_points: string[];
  objections: string[];
  new_contacts: Record<string, unknown>[];
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/ai/parse-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function applyParsedNotes(payload: {
  lead_id?: string;
  opp_id?: string;
  tasks?: Record<string, unknown>[];
  deal_updates?: Record<string, unknown>;
  key_points?: string[];
}): Promise<{ success: boolean; applied: Record<string, unknown> }> {
  const response = await fetchWithAuth(`${API_BASE}/api/ai/parse-notes/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getCoachTips(params?: {
  lead_id?: string;
  opp_id?: string;
}): Promise<{ tips: { title: string; tip: string }[] }> {
  const query = new URLSearchParams();
  if (params?.lead_id) query.set("lead_id", params.lead_id);
  if (params?.opp_id) query.set("opp_id", params.opp_id);
  const response = await fetchWithAuth(`${API_BASE}/api/coach/tips?${query}`);
  return handleResponse(response);
}

export async function getCoachPerformance(): Promise<{
  total_opportunities: number;
  won: number;
  lost: number;
  win_rate: number;
  insights: string[];
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/coach/performance`);
  return handleResponse(response);
}

export async function askCoach(payload: {
  question: string;
  lead_id?: string;
  opp_id?: string;
}): Promise<{ question: string; context: string[]; advice: string }> {
  const response = await fetchWithAuth(`${API_BASE}/api/coach/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getCoachDealReview(oppId: string): Promise<{
  opp_id: string;
  stage: string;
  value: number;
  activity_count: number;
  recommendation: string;
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/coach/deal/${oppId}/review`);
  return handleResponse(response);
}

export async function getForecast(params?: {
  period?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Record<string, unknown>> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  const response = await fetchWithAuth(`${API_BASE}/api/forecast?${query}`);
  return handleResponse(response);
}

export async function getForecastScenarios(): Promise<{
  scenarios: { name: string; remove_opp_ids: string[] }[];
}> {
  const response = await fetchWithAuth(`${API_BASE}/api/forecast/scenarios`);
  return handleResponse(response);
}

export async function runForecastScenario(payload: {
  remove_opp_ids?: string[];
  force_close_opp_ids?: string[];
}): Promise<{ baseline: Record<string, unknown>; scenario: Record<string, unknown> }> {
  const response = await fetchWithAuth(`${API_BASE}/api/forecast/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getForecastCoverage(target: number): Promise<{
  target: number;
  pipeline_value: number;
  coverage_ratio: number;
  gap: number;
}> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/forecast/coverage?target=${encodeURIComponent(String(target))}`,
  );
  return handleResponse(response);
}

export async function getForecastTrends(periods: number = 4): Promise<{
  trends: { period_index: number; forecast: number }[];
}> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/forecast/trends?periods=${encodeURIComponent(String(periods))}`,
  );
  return handleResponse(response);
}

// ============================================================================
// Data Import
// ============================================================================

export interface CSVUploadResponse {
  success: boolean;
  headers: string[];
  preview_rows: string[][];
  total_rows: number;
  suggested_mappings: { csv_column: string; crm_field: string }[];
}

export interface ColumnMapping {
  csv_column: string;
  crm_field: string;
}

export interface ImportPreviewResponse {
  success: boolean;
  preview: Record<string, string>[];
  row_count: number;
}

export interface ImportExecuteResponse {
  success: boolean;
  imported: number;
  total_rows: number;
  errors: { row: number; error: string }[];
}

export async function uploadCSV(file: File): Promise<CSVUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAuth(`${API_BASE}/api/import/csv/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function previewImport(file: File, mappings: ColumnMapping[]): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = new URL(`${API_BASE}/api/import/csv/preview`);
  url.searchParams.append('mappings', JSON.stringify(mappings));
  
  const response = await fetchWithAuth(url.toString(), {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function executeImport(file: File, mappings: ColumnMapping[]): Promise<ImportExecuteResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = new URL(`${API_BASE}/api/import/csv/execute`);
  url.searchParams.append('mappings', JSON.stringify(mappings));
  
  const response = await fetchWithAuth(url.toString(), {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}
