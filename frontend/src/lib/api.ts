const API_BASE = "http://localhost:8000/api/v1";

export interface Message {
  id: string;
  channel: string;
  author: string;
  content: string;
  timestamp: string;
  created_at: string;
}

export interface Topic {
  name: string;
  description: string;
  message_count: number;
  channels: string[];
}

export interface Sentiment {
  author: string;
  overall_sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
}

export interface ResponseTime {
  avg_response_minutes: number;
  min_response_minutes: number;
  max_response_minutes: number;
  total_responses: number;
}

export interface AnalysisResult {
  id: string;
  analysis_type: "topics" | "sentiment" | "response_time";
  result_data: {
    topics?: Topic[];
    sentiments?: Sentiment[];
    [author: string]: ResponseTime | Topic[] | Sentiment[] | undefined;
  };
  created_at: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API request failed");
  }
  return res.json();
}

export async function uploadMessages(messages: unknown[]): Promise<Message[]> {
  return apiFetch<Message[]>("/messages/", {
    method: "POST",
    body: JSON.stringify(messages),
  });
}

export async function getMessages(): Promise<Message[]> {
  return apiFetch<Message[]>("/messages/");
}

export async function triggerAnalysis(): Promise<{ status: string; results: AnalysisResult[] }> {
  return apiFetch("/insights/analyze", { method: "POST" });
}

export async function getInsights(): Promise<AnalysisResult[]> {
  return apiFetch<AnalysisResult[]>("/insights/");
}
