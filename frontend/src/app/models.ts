export interface ProfileInfo {
  full_name: string;
  avatar_url: string;
  bio_text: string;
  data_source: string;
  has_avatar: boolean;
  bio_filled: boolean;
  created_at: string;
}

export interface AnalyzeResponse {
  vk_id: string;
  label: 'REAL' | 'FAKE';
  probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  features: Record<string, number>;
  profile_info: ProfileInfo;
}

export interface BatchSummary {
  total: number;
  real_percent: number;
  fake_percent: number;
  suspicious_percent: number;
}

export interface BatchResponse {
  summary: BatchSummary;
  items: AnalyzeResponse[];
}
