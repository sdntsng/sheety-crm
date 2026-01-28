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

// Helper for authenticated requests with session error detection
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const session = await getSession();

    // Check if session exists at all
    if (!session || !session.user) {
      console.error("[API] No active session - redirecting to login");
      await signOut({ callbackUrl: "/login" });
      throw new AuthError("Authentication required. Please sign in.");
    }

    // Check if session has a refresh error - sign out if so
    // @ts-ignore
    if (session?.error === "RefreshAccessTokenError") {
      console.error("[API] Refresh token error detected - signing out");
      await signOut({ callbackUrl: "/login" });
      throw new AuthError("Session expired. Please sign in again.");
    }

    // @ts-ignore
    if (session?.accessToken) {
      // @ts-ignore
      headers["Authorization"] = `Bearer ${session.accessToken}`;

      // Inject Selected Sheet ID from localStorage
      const sheetId = localStorage.getItem("selected_sheet_id");
      if (sheetId) {
        headers["x-sheet-id"] = sheetId;
      }
    } else {
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
): Promise<{ leads: Lead[]; count: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (source) params.set("source", source);
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

export async function enrichLead(leadId: string): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/leads/${leadId}/enrich`,
    { method: "POST" },
  );
  return handleResponse(response);
}

export async function scoreLead(leadId: string): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/leads/${leadId}/score`,
    { method: "POST" },
  );
  return handleResponse(response);
}

// Opportunities
export async function getOpportunities(
  stage?: string,
  leadId?: string,
): Promise<{ opportunities: Opportunity[]; count: number }> {
  const params = new URLSearchParams();
  if (stage) params.set("stage", stage);
  if (leadId) params.set("lead_id", leadId);
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

export async function search(query: string): Promise<SearchResults> {
  const response = await fetchWithAuth(
    `${API_BASE}/api/search?q=${encodeURIComponent(query)}`,
  );
  return handleResponse(response);
}
