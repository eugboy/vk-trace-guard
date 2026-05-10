import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AnalyzeResponse, BatchResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://127.0.0.1:8000';

  constructor(private readonly http: HttpClient) {}

  predict(vkId: string): Observable<AnalyzeResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/predict`, { vk_id: vkId })
      .pipe(map((payload) => this.normalizeAnalyze(payload)));
  }

  analyzeFollowers(vkId: string): Observable<BatchResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/analyze-followers`, {
        vk_id: vkId,
        limit: 20,
      })
      .pipe(map((payload) => this.normalizeBatch(payload)));
  }

  analyzeCommunity(groupId: string): Observable<BatchResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/analyze-community`, {
        group_id: groupId,
        limit: 20,
      })
      .pipe(map((payload) => this.normalizeBatch(payload)));
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

  private normalizeBatch(payload: unknown): BatchResponse {
    const source = (payload ?? {}) as Partial<BatchResponse> & { items?: unknown[] };
    const summary = source.summary ?? {
      total: 0,
      real_percent: 0,
      fake_percent: 0,
      suspicious_percent: 0,
    };
    return {
      summary: {
        total: Number(summary.total ?? 0),
        real_percent: Number(summary.real_percent ?? 0),
        fake_percent: Number(summary.fake_percent ?? 0),
        suspicious_percent: Number(summary.suspicious_percent ?? 0),
      },
      items: Array.isArray(source.items) ? source.items.map((item) => this.normalizeAnalyze(item)) : [],
    };
  }

  private normalizeAnalyze(payload: unknown): AnalyzeResponse {
    const source = (payload ?? {}) as Partial<AnalyzeResponse>;
    const profile = source.profile_info ?? {
      full_name: '',
      avatar_url: '',
      bio_text: '',
      data_source: 'unknown',
      has_avatar: false,
      bio_filled: false,
      created_at: '',
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
        data_source: String(profile.data_source ?? 'unknown'),
        has_avatar: Boolean(profile.has_avatar),
        bio_filled: Boolean(profile.bio_filled),
        created_at: String(profile.created_at ?? ''),
      },
    };
  }
}
