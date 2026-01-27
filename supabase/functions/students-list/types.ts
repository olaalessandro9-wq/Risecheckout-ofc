/**
 * Types for students-list Edge Function
 * RISE V3 Compliant - Separated from router
 */

export interface JsonResponseData {
  students?: StudentResponse[];
  student?: StudentDetail;
  total?: number;
  page?: number;
  limit?: number;
  stats?: StudentStats;
  success?: boolean;
  error?: string;
  producer_info?: ProducerInfo;
}

export interface ProducerInfo {
  id: string;
  name: string | null;
  email: string | null;
}

export interface StudentStats {
  totalStudents: number;
  averageProgress: number;
  completionRate: number;
}

export interface AccessRecord {
  id: string;
  buyer_id: string;
  granted_at: string;
  expires_at: string | null;
  access_type: string;
  order_id: string | null;
  is_active: boolean;
}

export interface BuyerRecord {
  id: string;
  name: string | null;
  email: string;
  last_login_at: string | null;
  password_hash: string | null;
}

export interface BuyerGroupRecord {
  id: string;
  buyer_id: string;
  group_id: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
}

export interface ProgressRecord {
  buyer_id: string;
  progress_percent: number | null;
}

export interface StudentResponse {
  buyer_id: string;
  buyer_email: string;
  buyer_name: string | null;
  groups: BuyerGroupRecord[];
  access_type: string;
  last_access_at: string | null;
  status: "pending" | "active";
  invited_at: string;
  progress_percent: number;
}

export interface StudentDetail {
  id: string;
  email: string;
  name: string | null;
  access: unknown[];
  groups: unknown[];
  progress: unknown[];
}

export interface ListRequest {
  action: "list" | "get" | "get-producer-info";
  product_id?: string;
  buyer_id?: string;
  page?: number;
  limit?: number;
  search?: string;
  access_type?: string;
  status?: string;
  group_id?: string;
}
