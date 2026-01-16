import { getSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8026';

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
  pipeline_by_stage: Record<string, { count: number; total_value: number; expected_value: number }>;
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

// Helper for handling fetch responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
}

// Helper for authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let headers: Record<string, string> = { ...(options.headers as Record<string, string>) };

  if (typeof window !== 'undefined') {
    const session = await getSession();
    // @ts-ignore
    if (session?.accessToken) {
      // @ts-ignore
      headers['Authorization'] = `Bearer ${session.accessToken}`;
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

// ============================================================================
// Leads
// ============================================================================

// Converted to fetchWithAuth via sed/multi-replace logic not fully applicable for all lines at once,
// but simpler effectively replacing distinct blocks.

// Leads
export async function getLeads(status?: string, source?: string): Promise<{ leads: Lead[]; count: number }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (source) params.set('source', source);
  const response = await fetchWithAuth(`${API_BASE}/api/leads?${params}`);
  return handleResponse(response);
}

export async function getLead(leadId: string): Promise<Lead> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads/${leadId}`);
  return handleResponse(response);
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateLead(leadId: string, data: Partial<Lead>): Promise<Lead> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteLead(leadId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/api/leads/${leadId}`, { method: 'DELETE' });
  return handleResponse(response);
}

// Opportunities
export async function getOpportunities(stage?: string, leadId?: string): Promise<{ opportunities: Opportunity[]; count: number }> {
  const params = new URLSearchParams();
  if (stage) params.set('stage', stage);
  if (leadId) params.set('lead_id', leadId);
  const response = await fetchWithAuth(`${API_BASE}/api/opportunities?${params}`);
  return handleResponse(response);
}

export async function getOpportunity(oppId: string): Promise<Opportunity> {
  const response = await fetchWithAuth(`${API_BASE}/api/opportunities/${oppId}`);
  return handleResponse(response);
}

export async function createOpportunity(data: Partial<Opportunity>): Promise<Opportunity> {
  const response = await fetchWithAuth(`${API_BASE}/api/opportunities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateOpportunity(oppId: string, data: Partial<Opportunity>): Promise<Opportunity> {
  const response = await fetchWithAuth(`${API_BASE}/api/opportunities/${oppId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateOpportunityStage(oppId: string, stage: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/api/opportunities/${oppId}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage }),
  });
  return handleResponse(response);
}

export async function deleteOpportunity(oppId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/api/opportunities/${oppId}`, { method: 'DELETE' });
  return handleResponse(response);
}

// Activities
export async function getActivities(leadId?: string, oppId?: string): Promise<{ activities: Activity[]; count: number }> {
  const params = new URLSearchParams();
  if (leadId) params.set('lead_id', leadId);
  if (oppId) params.set('opp_id', oppId);
  const response = await fetchWithAuth(`${API_BASE}/api/activities?${params}`);
  return handleResponse(response);
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  const response = await fetchWithAuth(`${API_BASE}/api/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}
