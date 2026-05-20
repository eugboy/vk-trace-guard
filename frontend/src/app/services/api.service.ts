import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  AnalyzeResponse,
  FeedbackResponse,
  FeedbackStats,
  FeedbackVerdict,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://127.0.0.1:8000';

  constructor(private readonly http: HttpClient) {}

  predict(vkId: string): Observable<AnalyzeResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/predict`, { vk_id: vkId })
      .pipe(map((payload) => this.normalizeAnalyze(payload)));
  }

  history(): Observable<Array<{ vk_id: string; label: string; probability: number }>> {
    return this.http.get<Array<{ vk_id: string; label: string; probability: number }>>(
      `${this.baseUrl}/history`
    );
  }

  metrics(): Observable<{ accuracy?: number; feature_importance: Record<string, number> }> {
    return this.http.get<{ accuracy?: number; feature_importance: Record<string, number> }>(
      `${this.baseUrl}/metrics`
    );
  }

  feedbackStats(): Observable<FeedbackStats> {
    return this.http.get<FeedbackStats>(`${this.baseUrl}/feedback/stats`);
  }

  submitFeedback(
    vkId: string,
    features: Record<string, number>,
    predictedLabel: 'REAL' | 'FAKE',
    verdict: FeedbackVerdict
  ): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.baseUrl}/feedback`, {
      vk_id: vkId,
      features,
      predicted_label: predictedLabel,
      verdict,
    });
  }

  private normalizeAnalyze(payload: unknown): AnalyzeResponse {
    const source = (payload ?? {}) as Partial<AnalyzeResponse>;
    const profile = source.profile_info ?? {
      full_name: '',
      avatar_url: '',
      bio_text: '',
      data_source: 'vk_api',
      has_avatar: false,
      bio_filled: false,
    };
    return {
      vk_id: String(source.vk_id ?? ''),
      label: source.label === 'FAKE' ? 'FAKE' : 'REAL',
      probability: Number(source.probability ?? 0),
      risk_level:
        source.risk_level === 'HIGH' || source.risk_level === 'MEDIUM' || source.risk_level === 'LOW'
          ? source.risk_level
          : 'LOW',
      reasons: Array.isArray(source.reasons) ? source.reasons.filter((x): x is string => typeof x === 'string') : [],
      features: source.features ?? {},
      profile_info: {
        full_name: String(profile.full_name ?? ''),
        avatar_url: String(profile.avatar_url ?? ''),
        bio_text: String(profile.bio_text ?? ''),
        data_source: String(profile.data_source ?? 'vk_api'),
        has_avatar: Boolean(profile.has_avatar),
        bio_filled: Boolean(profile.bio_filled),
      },
      ollama_analysis:
        typeof source.ollama_analysis === 'string' ? source.ollama_analysis : null,
      ollama_error: typeof source.ollama_error === 'string' ? source.ollama_error : null,
    };
  }
}
