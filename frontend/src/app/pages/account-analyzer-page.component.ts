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
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';

import { ApiService } from '../services/api.service';
import { AnalyzeResponse, TrainingResponse } from '../models';

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
    DividerModule,
    AvatarModule,
    TooltipModule,
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
                Анализ активности, цифрового следа, друзей,
                подписчиков и ML-признаков.
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
                  <i class="pi pi-user"></i>
                  Профиль VK
                </div>

                <div class="profile-top">

                  @if (result.profile_info?.avatar_url) {

                    <div class="avatar-wrapper">

                      <img
                        [src]="result.profile_info?.avatar_url"
                        alt="avatar"
                        class="avatar-image"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                      />

                      <div class="avatar-ring"></div>

                    </div>

                  } @else {

                    <div class="avatar-fallback">
                      <i class="pi pi-user"></i>
                    </div>

                  }

                  <div class="profile-main">

                    <div class="profile-name">
                      {{
                        result.profile_info?.full_name
                          || 'Неизвестный пользователь'
                      }}
                    </div>

                    <div class="profile-id">
                      {{ result.vk_id || vkId }}
                    </div>

                    <div class="profile-status">

                      <div class="status-dot"></div>

                      {{
                        result.profile_info?.data_source === 'vk_api'
                          ? 'Данные из VK API'
                          : 'Mock fallback'
                      }}

                    </div>

                  </div>

                </div>

                <div class="info-list">

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

                  <div class="info-item">
                    <span>Дата создания</span>
                    <b>
                      {{
                        result.profile_info?.created_at
                          || 'Неизвестно'
                      }}
                    </b>
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

              <div class="glass-card labeling-card" *ngIf="result">
                <div class="card-header">
                  <i class="pi pi-bookmark"></i>
                  Разметка для обучения
                </div>
                
                <p class="labeling-description">
                  Помогите улучшить модель, указав правильный статус аккаунта:
                </p>
                
                <div class="labeling-buttons">
                  <button
                    pButton
                    type="button"
                    label="Фейк"
                    icon="pi pi-times"
                    class="p-button-danger labeling-btn"
                    [loading]="labelingLoading"
                    (click)="labelAccount(1)"
                  ></button>
                  
                  <button
                    pButton
                    type="button"
                    label="Реальный"
                    icon="pi pi-check"
                    class="p-button-success labeling-btn"
                    [loading]="labelingLoading"
                    (click)="labelAccount(0)"
                  ></button>
                  
                  <button
                    pButton
                    type="button"
                    label="Неизвестно"
                    icon="pi pi-question"
                    class="p-button-secondary labeling-btn"
                    [disabled]="true"
                    pTooltip="Эта опция пока недоступна"
                    tooltipPosition="top"
                  ></button>
                </div>
                
                <div class="labeling-result" *ngIf="labelingResult">
                  <div [class]="'labeling-status ' + (labelingResult.success ? 'success' : 'error')">
                    <i [class]="'pi ' + (labelingResult.success ? 'pi-check-circle' : 'pi-times-circle')"></i>
                    {{ labelingResult.message }}
                  </div>
                  <div class="labeling-metrics" *ngIf="labelingResult.success">
                    <span class="metric-item">Accuracy: {{ labelingResult.metrics.accuracy }}</span>
                    <span class="metric-item">F1-Score: {{ labelingResult.metrics.f1_score }}</span>
                  </div>
                </div>
              </div>

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

    .profile-top {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .avatar-wrapper {
      position: relative;
      width: 130px;
      height: 130px;
      flex-shrink: 0;
    }

    .avatar-image {
      width: 130px;
      height: 130px;
      object-fit: cover;
      border-radius: 26px;
      display: block;
      position: relative;
      z-index: 2;
      background: #111827;
      border: 3px solid rgba(255,255,255,.12);
      box-shadow:
        0 15px 35px rgba(0,0,0,.35);
    }

    .avatar-ring {
      position: absolute;
      inset: -5px;
      border-radius: 30px;
      background:
        linear-gradient(
          135deg,
          #3b82f6,
          #8b5cf6
        );
      z-index: 1;
      opacity: .7;
      filter: blur(12px);
    }

    .avatar-fallback {
      width: 130px;
      height: 130px;
      border-radius: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.08);
    }

    .profile-main {
      flex: 1;
    }

    .profile-name {
      font-size: 1.8rem;
      font-weight: 700;
      line-height: 1.1;
    }

    .profile-id {
      color: #60a5fa;
      margin-top: .5rem;
      font-weight: 600;
    }

    .profile-status {
      margin-top: 1rem;
      display: inline-flex;
      align-items: center;
      gap: .6rem;
      padding: .55rem .9rem;
      border-radius: 999px;
      background: rgba(16,185,129,.12);
      color: #6ee7b7;
      border: 1px solid rgba(16,185,129,.2);
      font-size: .92rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #10b981;
      box-shadow: 0 0 12px #10b981;
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

      .profile-top {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
  labelingLoading = false;
  labelingResult?: TrainingResponse;

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
    this.labelingResult = undefined;

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

  labelAccount(label: number): void {
    if (!this.result?.vk_id) {
      return;
    }

    this.labelingLoading = true;
    this.labelingResult = undefined;

    this.api
      .labelTrainingData({ vk_id: this.result.vk_id, label })
      .pipe(
        finalize(() => {
          this.labelingLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.labelingResult = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.labelingResult = {
            success: false,
            message: err?.error?.detail ?? 'Ошибка при сохранении разметки',
            metrics: {},
          };
          this.cdr.detectChanges();
        },
      });
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

  
          this.labelingLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.labelingResult = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.labelingResult = {
            success: false,
            message: err?.error?.detail ?? 'Ошибка при сохранении разметки',
            metrics: {},
          };
          this.cdr.detectChanges();
        },
      });
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

      'New account':
        'Недавно созданный аккаунт',

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