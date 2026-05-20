export interface ProfileInfo {
  full_name: string;
  avatar_url: string;
  bio_text: string;
  data_source: string;
  has_avatar: boolean;
  bio_filled: boolean;
}

export interface AnalyzeResponse {
  vk_id: string;
  label: 'REAL' | 'FAKE';
  probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  features: Record<string, number>;
  profile_info: ProfileInfo;
  ollama_analysis?: string | null;
  ollama_error?: string | null;
}

export type FeedbackVerdict = 'correct' | 'incorrect_real' | 'incorrect_fake';

export interface FeedbackResponse {
  message: string;
  true_label: 'REAL' | 'FAKE';
  metrics: {
    accuracy?: number;
    training_samples?: number;
    feedback_samples?: number;
    feature_importance?: Record<string, number>;
  };
}

export interface FeedbackStats {
  total: number;
  correct: number;
  incorrect_real: number;
  incorrect_fake: number;
  labels_real: number;
  labels_fake: number;
  accuracy_percent: number;
}
