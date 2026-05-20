import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiService } from '../services/api.service';
import { AnalyzeResponse, FeedbackVerdict } from '../models';

@Component({
  selector: 'app-account-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    SkeletonModule,
  ],
  template: `
      <p-card styleClass="main-card">

        <ng-template pTemplate="header">
          <div class="hero">

            <div class="hero-text">
              <div class="badge">
                <i class="pi pi-shield"></i>
                AI-анализ VK профиля
              </div>

              <h1>Проверка аккаунта на фейк</h1>

              <p>
                ML-анализ цифрового следа и экспертная оценка
                нейросети Ollama.
              </p>
            </div>

          </div>
        </ng-template>

        <div class="search-panel">

          <div class="input-wrapper">
            <i class="pi pi-search"></i>

            <input
              pInputText
              [(ngModel)]="vkId"
              class="search-input"
              placeholder="Введите ID или ссылку VK"
              (keyup.enter)="analyze()"
            />
          </div>

          <button
            pButton
            type="button"
            label="Анализировать"
            icon="pi pi-bolt"
            class="analyze-btn"
            [loading]="loading"
            [disabled]="loading || !vkId"
            (click)="analyze()"
          ></button>

        </div>

        @if (errorText) {
          <div class="error-box">
            <i class="pi pi-times-circle"></i>
            <span>{{ errorText }}</span>
          </div>
        }

        @if (loading) {

          <div class="loading-layout">

            <p-skeleton
              height="220px"
              borderRadius="24px"
            ></p-skeleton>

            <div class="loading-grid">
              <p-skeleton
                height="320px"
                borderRadius="24px"
              ></p-skeleton>

              <p-skeleton
                height="320px"
                borderRadius="24px"
              ></p-skeleton>
            </div>

            <p-skeleton
              height="280px"
              borderRadius="24px"
            ></p-skeleton>

          </div>

        }

        @if (!loading && result) {

          <div class="content">

            <div class="summary-grid">

              <div class="glass-card risk-card">

                <div class="risk-header">

                  <div>
                    <div class="small-title">
                      Результат анализа
                    </div>

                    <div class="risk-main">
                      {{
                        result.label === 'FAKE'
                          ? 'ФЕЙК'
                          : 'РЕАЛЬНЫЙ'
                      }}
                    </div>
                  </div>

                  <p-tag
                    [value]="riskRu(result.risk_level)"
                    [severity]="
                      result.risk_level === 'HIGH'
                        ? 'danger'
                        : result.risk_level === 'MEDIUM'
                        ? 'warning'
                        : 'success'
                    "
                  ></p-tag>

                </div>

                <div class="progress-info">

                  <div class="progress-label">
                    Вероятность фейка
                  </div>

                  <div class="progress-value">
                    {{ (result.probability * 100) | number:'1.0-1' }}%
                  </div>

                </div>

                <p-progressBar
                  [value]="result.probability * 100"
                  [showValue]="false"
                  styleClass="modern-progress"
                ></p-progressBar>

              </div>

              <div class="glass-card reasons-card">

                <div class="small-title">
                  Причины риска
                </div>

                <div class="reasons-list">

                  @for (reason of result.reasons; track reason) {

                    <div class="reason-chip">
                      <i class="pi pi-info-circle"></i>
                      {{ reasonRu(reason) }}
                    </div>

                  }

                </div>

              </div>

            </div>

            <div class="details-grid">

              <div class="profile-card glass-card">

                <div class="card-header">
                  <i class="pi pi-id-card"></i>
                  Информация о пользователе
                </div>

                <div class="info-list">

                  <div class="info-item">
                    <span>ID пользователя</span>
                    <b>{{ result.vk_id || vkId }}</b>
                  </div>

                  <div class="info-item">
                    <span>Аватар</span>
                    <b>
                      {{
                        result.profile_info?.has_avatar
                          ? 'Есть'
                          : 'Нет'
                      }}
                    </b>
                  </div>

                  <div class="info-item">
                    <span>Био</span>
                    <b>
                      {{
                        result.profile_info?.bio_filled
                          ? 'Заполнено'
                          : 'Пусто'
                      }}
                    </b>
                  </div>

                  @if (result.profile_info?.bio_text) {
                    <div class="info-item bio-item">
                      <span>Текст био</span>
                      <b>{{ result.profile_info?.bio_text }}</b>
                    </div>
                  }

                  <div class="info-item">
                    <span>Источник данных</span>
                    <b>VK API</b>
                  </div>

                </div>

              </div>

              <div class="stats-card glass-card">

                <div class="card-header">
                  <i class="pi pi-chart-line"></i>
                  Цифровой след
                </div>

                <div class="stats-grid">

                  <div class="stat-box">
                    <div class="stat-value">
                      {{ result.features?.['friends_count'] ?? 0 }}
                    </div>

                    <div class="stat-label">
                      Друзья
                    </div>
                  </div>

                  <div class="stat-box">
                    <div class="stat-value">
                      {{ result.features?.['followers_count'] ?? 0 }}
                    </div>

                    <div class="stat-label">
                      Подписчики
                    </div>
                  </div>

                  <div class="stat-box">
                    <div class="stat-value">
                      {{ result.features?.['posts_count'] ?? 0 }}
                    </div>

                    <div class="stat-label">
                      Посты
                    </div>
                  </div>

                  <div class="stat-box">
                    <div class="stat-value">
                      {{ result.features?.['groups_count'] ?? 0 }}
                    </div>

                    <div class="stat-label">
                      Группы
                    </div>
                  </div>

                  

                  <div class="stat-box">
                    <div class="stat-value">
                      {{
                        result.features?.['followers_friends_ratio']
                          | number:'1.1-1'
                      }}
                    </div>

                    <div class="stat-label">
                      F/F Ratio
                    </div>
                  </div>

                </div>

              </div>

            </div>

            <div class="glass-card ollama-card">

              <div class="card-header">
                <i class="pi pi-sparkles"></i>
                Анализ Ollama
              </div>

              @if (result.ollama_analysis) {
                <div class="ollama-text">{{ result.ollama_analysis }}</div>
              } @else if (result.ollama_error) {
                <div class="ollama-error">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span>{{ result.ollama_error }}</span>
                </div>
              } @else {
                <div class="ollama-error">
                  <span>Анализ Ollama недоступен</span>
                </div>
              }

            </div>

            <div class="glass-card feedback-card">

              <div class="feedback-header">
                <div class="feedback-header-icon">
                  <i class="pi pi-check-square"></i>
                </div>
                <div>
                  <div class="feedback-title">Проверка результата</div>
                  <p class="feedback-desc">
                    Если знаете реальный статус аккаунта, укажите,
                    верен ли анализ. Данные пойдут в дообучение ML-модели.
                  </p>
                </div>
              </div>

              @if (feedbackSubmitted && feedbackMessage) {
                <div class="feedback-success">
                  <i class="pi pi-check-circle"></i>
                  <span>{{ feedbackMessage }}</span>
                </div>
              } @else {
                <div class="feedback-actions" [class.is-loading]="feedbackLoading">

                  <button
                    type="button"
                    class="feedback-option correct"
                    [disabled]="feedbackLoading"
                    (click)="submitFeedback('correct')"
                  >
                    <span class="option-icon-wrap correct">
                      <i class="pi pi-thumbs-up"></i>
                    </span>
                    <span class="option-title">Анализ верный</span>
                    <span class="option-hint">Результат совпадает</span>
                  </button>

                  <button
                    type="button"
                    class="feedback-option real"
                    [disabled]="feedbackLoading"
                    (click)="submitFeedback('incorrect_real')"
                  >
                    <span class="option-icon-wrap real">
                      <i class="pi pi-user"></i>
                    </span>
                    <span class="option-title">Неверно — реальный</span>
                    <span class="option-hint">Аккаунт настоящий</span>
                  </button>

                  <button
                    type="button"
                    class="feedback-option fake"
                    [disabled]="feedbackLoading"
                    (click)="submitFeedback('incorrect_fake')"
                  >
                    <span class="option-icon-wrap fake">
                      <i class="pi pi-ban"></i>
                    </span>
                    <span class="option-title">Неверно — фейк</span>
                    <span class="option-hint">Аккаунт поддельный</span>
                  </button>

                </div>

                @if (feedbackLoading) {
                  <div class="feedback-loading-hint">
                    <i class="pi pi-spin pi-spinner"></i>
                    Сохраняем разметку и переобучаем модель…
                  </div>
                }
              }

              @if (feedbackError) {
                <div class="feedback-error">
                  <i class="pi pi-times-circle"></i>
                  <span>{{ feedbackError }}</span>
                </div>
              }

            </div>

          </div>

        }

      </p-card>

  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      color: #fff;
    }

    .bg-glow {
      position: absolute;
      border-radius: 999px;
      filter: blur(90px);
      opacity: .18;
      pointer-events: none;
    }

    .glow-1 {
      width: 300px;
      height: 300px;
      background: #3b82f6;
      top: -50px;
      left: -100px;
    }

    .glow-2 {
      width: 280px;
      height: 280px;
      background: #8b5cf6;
      bottom: 0;
      right: -80px;
    }

    .main-card {
      overflow: hidden;
      border-radius: 32px;
      backdrop-filter: blur(20px);
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow:
        0 25px 80px rgba(0,0,0,.45);
    }

    .hero {
      padding: 2.5rem 2.5rem 1rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      padding: .55rem 1rem;
      border-radius: 999px;
      background: rgba(59,130,246,.12);
      border: 1px solid rgba(59,130,246,.25);
      color: #93c5fd;
      margin-bottom: 1.2rem;
      font-size: .9rem;
      font-weight: 600;
    }

    .hero h1 {
      margin: 0;
      font-size: 3rem;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -1px;
    }

    .hero p {
      margin-top: 1rem;
      max-width: 700px;
      color: #94a3b8;
      font-size: 1.05rem;
      line-height: 1.7;
    }

    .search-panel {
      display: flex;
      gap: 1rem;
      padding: 0 2.5rem 2rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .input-wrapper {
      position: relative;
      flex: 1;
      min-width: 300px;
    }

    .input-wrapper i {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      z-index: 2;
    }

    .search-input {
      width: 100%;
      padding-left: 3rem !important;
      height: 58px;
      border-radius: 18px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      color: #fff;
      font-size: 1rem;
    }

    .search-input:focus {
      box-shadow:
        0 0 0 4px rgba(59,130,246,.15);
      border-color: #3b82f6;
    }

    .analyze-btn {
      height: 58px;
      border-radius: 18px;
      padding: 0 2rem;
      font-weight: 700;
    }

    .error-box {
      margin: 0 2.5rem 2rem;
      padding: 1rem 1.25rem;
      border-radius: 18px;
      display: flex;
      align-items: center;
      gap: .75rem;
      background: rgba(239,68,68,.12);
      border: 1px solid rgba(239,68,68,.25);
      color: #fca5a5;
    }

    .loading-layout {
      padding: 0 2.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(320px,1fr));
      gap: 1rem;
    }

    .content {
      padding: 0 2.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .summary-grid,
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(360px,1fr));
      gap: 1.25rem;
    }

    .glass-card {
      position: relative;
      overflow: hidden;
      border-radius: 28px;
      padding: 1.5rem;
      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,.06),
          rgba(255,255,255,.03)
        );
      border: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(12px);
    }

    .glass-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          135deg,
          rgba(255,255,255,.08),
          transparent
        );
      pointer-events: none;
    }

    .small-title {
      color: #94a3b8;
      font-size: .92rem;
      margin-bottom: .5rem;
    }

    .risk-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .risk-main {
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: -1px;
    }

    .progress-info {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }

    .progress-label {
      color: #94a3b8;
      margin-bottom: .5rem;
    }

    .progress-value {
      font-size: 2rem;
      font-weight: 700;
    }

    .reasons-list {
      display: flex;
      flex-wrap: wrap;
      gap: .75rem;
      margin-top: 1rem;
    }

    .reason-chip {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .8rem 1rem;
      border-radius: 14px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.06);
      font-size: .95rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: .75rem;
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.1rem;
      border-radius: 16px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.05);
    }

    .info-item span {
      color: #94a3b8;
    }

    .info-item.bio-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .info-item.bio-item b {
      margin-top: .5rem;
      line-height: 1.5;
      word-break: break-word;
    }

    .ollama-card {
      width: 100%;
    }

    .ollama-text {
      white-space: pre-wrap;
      line-height: 1.7;
      color: #e2e8f0;
      font-size: .98rem;
    }

    .ollama-error {
      display: flex;
      align-items: flex-start;
      gap: .75rem;
      padding: 1rem 1.1rem;
      border-radius: 16px;
      background: rgba(245,158,11,.1);
      border: 1px solid rgba(245,158,11,.25);
      color: #fcd34d;
      line-height: 1.5;
    }

    .feedback-card {
      width: 100%;
    }

    .feedback-header {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
      margin-bottom: 1.75rem;
    }

    .feedback-header-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: rgba(59,130,246,.15);
      border: 1px solid rgba(59,130,246,.25);
      color: #93c5fd;
      font-size: 1.35rem;
    }

    .feedback-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: .5rem;
    }

    .feedback-desc {
      margin: 0;
      color: #94a3b8;
      line-height: 1.65;
      font-size: .95rem;
      max-width: 720px;
    }

    .feedback-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      width: 100%;
    }

    .feedback-actions.is-loading {
      opacity: .65;
      pointer-events: none;
    }

    .feedback-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: .65rem;
      min-height: 148px;
      padding: 1.35rem 1rem;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.04);
      color: #fff;
      cursor: pointer;
      transition:
        transform .2s ease,
        border-color .2s ease,
        background .2s ease,
        box-shadow .2s ease;
      text-align: center;
    }

    .feedback-option:hover:not(:disabled) {
      transform: translateY(-3px);
      background: rgba(255,255,255,.07);
      box-shadow: 0 12px 32px rgba(0,0,0,.25);
    }

    .feedback-option:disabled {
      cursor: not-allowed;
    }

    .option-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .option-icon-wrap.correct {
      background: rgba(34,197,94,.15);
      border: 1px solid rgba(34,197,94,.28);
      color: #4ade80;
    }

    .option-icon-wrap.real {
      background: rgba(59,130,246,.15);
      border: 1px solid rgba(59,130,246,.28);
      color: #60a5fa;
    }

    .option-icon-wrap.fake {
      background: rgba(239,68,68,.15);
      border: 1px solid rgba(239,68,68,.28);
      color: #f87171;
    }

    .feedback-option.correct:hover:not(:disabled) {
      border-color: rgba(34,197,94,.45);
    }

    .feedback-option.real:hover:not(:disabled) {
      border-color: rgba(59,130,246,.45);
    }

    .feedback-option.fake:hover:not(:disabled) {
      border-color: rgba(239,68,68,.45);
    }

    .option-title {
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.3;
    }

    .option-hint {
      font-size: .82rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .feedback-loading-hint {
      margin-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .65rem;
      color: #93c5fd;
      font-size: .92rem;
    }

    .feedback-success {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: 1rem 1.1rem;
      border-radius: 16px;
      background: rgba(34,197,94,.12);
      border: 1px solid rgba(34,197,94,.25);
      color: #86efac;
    }

    .feedback-error {
      margin-top: 1rem;
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: 1rem 1.1rem;
      border-radius: 16px;
      background: rgba(239,68,68,.12);
      border: 1px solid rgba(239,68,68,.25);
      color: #fca5a5;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2,1fr);
      gap: 1rem;
    }

    .stat-box {
      padding: 1.25rem;
      border-radius: 20px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.05);
      transition: .25s;
    }

    .stat-box:hover {
      transform: translateY(-4px);
      background: rgba(255,255,255,.06);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1;
    }

    .stat-label {
      margin-top: .5rem;
      color: #94a3b8;
    }

    @media (max-width: 1024px) {
      .feedback-actions {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {

      .page {
        padding: 1rem;
      }

      .hero {
        padding: 2rem 1.5rem 1rem;
      }

      .hero h1 {
        font-size: 2.2rem;
      }

      .search-panel,
      .content {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }

      .search-panel {
        flex-direction: column;
        align-items: stretch;
      }

      .analyze-btn {
        width: 100%;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .feedback-header {
        flex-direction: column;
      }

      .feedback-actions {
        grid-template-columns: 1fr;
      }

      .feedback-option {
        min-height: 120px;
      }
    }
  `],
})
export class AccountAnalyzerPageComponent {

  vkId = '';
  loading = false;
  result?: AnalyzeResponse;
  errorText = '';
  feedbackLoading = false;
  feedbackSubmitted = false;
  feedbackMessage = '';
  feedbackError = '';

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  analyze(): void {

    if (!this.vkId?.trim()) {
      return;
    }

    this.loading = true;
    this.errorText = '';
    this.result = undefined;
    this.resetFeedback();

    this.api
      .predict(this.vkId.trim())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (res) => {

          console.log('API RESPONSE:', res);

          this.result = {
            ...res,
            reasons: res?.reasons ?? [],
            features: res?.features ?? {},
            profile_info: res?.profile_info ?? {},
            ollama_analysis: res?.ollama_analysis ?? null,
            ollama_error: res?.ollama_error ?? null,
          };

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(err);

          this.errorText =
            err?.error?.detail
            ?? 'Не удалось получить данные анализа';

          this.cdr.detectChanges();
        },
      });
  }

  submitFeedback(verdict: FeedbackVerdict): void {
    if (!this.result) {
      return;
    }

    this.feedbackLoading = true;
    this.feedbackError = '';
    this.feedbackMessage = '';

    this.api
      .submitFeedback(
        this.result.vk_id,
        this.result.features,
        this.result.label,
        verdict
      )
      .subscribe({
        next: (res) => {
          this.feedbackSubmitted = true;
          this.feedbackMessage = `${res.message}. Сохранена метка: ${
            res.true_label === 'FAKE' ? 'фейк' : 'реальный'
          }. Обучающих примеров: ${res.metrics.training_samples ?? '—'}.`;
          this.feedbackLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.feedbackError =
            err?.error?.detail ?? 'Не удалось сохранить разметку';
          this.feedbackLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private resetFeedback(): void {
    this.feedbackLoading = false;
    this.feedbackSubmitted = false;
    this.feedbackMessage = '';
    this.feedbackError = '';
  }

  riskRu(risk: string): string {

    switch (risk) {

      case 'HIGH':
        return 'Высокий';

      case 'MEDIUM':
        return 'Средний';

      default:
        return 'Низкий';
    }
  }

  reasonRu(reason: string): string {

    const map: Record<string, string> = {

      'Low friends count':
        'Слишком мало друзей',

      'No profile avatar':
        'Нет аватара профиля',

      'Very low posting activity':
        'Низкая активность публикаций',

      'Unusual followers/friends ratio':
        'Подозрительное соотношение подписчиков и друзей',

      'Combined ML risk signals':
        'Комбинация нескольких подозрительных признаков',
    };

    return map[reason] ?? reason;
  }
}