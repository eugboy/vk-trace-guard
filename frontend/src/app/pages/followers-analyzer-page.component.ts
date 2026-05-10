import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';

import { AnalyzeResponse } from '../models';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-followers-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    ChartModule,
    TagModule,
    SkeletonModule,
    ProgressBarModule,
  ],
  template: `

      <p-card styleClass="main-card">

        <ng-template pTemplate="header">

          <div class="hero">

            <div class="hero-badge">
              <i class="pi pi-users"></i>
              AI-анализ подписчиков
            </div>

            <h1>Проверка аудитории пользователя</h1>

            <p>
              Анализ подписчиков, определение фейков,
              подозрительных аккаунтов и риск-факторов.
            </p>

          </div>

        </ng-template>

        <div class="search-panel">

          <div class="input-wrapper">

            <i class="pi pi-search"></i>

            <input
              pInputText
              [(ngModel)]="vkId"
              class="search-input"
              placeholder="Введите ID пользователя VK"
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
              height="260px"
              borderRadius="24px"
            ></p-skeleton>

            <p-skeleton
              height="520px"
              borderRadius="24px"
            ></p-skeleton>

          </div>

        }

        @if (!loading && summary) {

          <div class="content">

            <div class="top-grid">

              <div class="chart-card glass-card">

                <div class="card-title">
                  <i class="pi pi-chart-pie"></i>
                  Распределение аудитории
                </div>

                <p-chart
                  type="doughnut"
                  [data]="pieData"
                  [options]="chartOptions"
                  height="320"
                ></p-chart>

              </div>

              <div class="summary-column">

                <div class="summary-card real-card">

                  <div class="summary-top">
                    <span>Реальные</span>
                    <i class="pi pi-check-circle"></i>
                  </div>

                  <div class="summary-value">
                    {{ summary.real_percent }}%
                  </div>

                  <p-progressBar
                    [value]="summary.real_percent"
                    [showValue]="false"
                  ></p-progressBar>

                </div>

                <div class="summary-card fake-card">

                  <div class="summary-top">
                    <span>Фейки</span>
                    <i class="pi pi-times-circle"></i>
                  </div>

                  <div class="summary-value">
                    {{ summary.fake_percent }}%
                  </div>

                  <p-progressBar
                    [value]="summary.fake_percent"
                    [showValue]="false"
                  ></p-progressBar>

                </div>

                <div class="summary-card suspicious-card">

                  <div class="summary-top">
                    <span>Подозрительные</span>
                    <i class="pi pi-exclamation-triangle"></i>
                  </div>

                  <div class="summary-value">
                    {{ summary.suspicious_percent }}%
                  </div>

                  <p-progressBar
                    [value]="summary.suspicious_percent"
                    [showValue]="false"
                  ></p-progressBar>

                </div>

              </div>

            </div>

            <div class="table-wrapper">

              <div class="table-header">

                <div>
                  <h2>Подписчики</h2>

                  <p>
                    Проанализировано:
                    <b>{{ items.length }}</b>
                    аккаунтов
                  </p>
                </div>

              </div>

              <p-table
                [value]="items"
                responsiveLayout="scroll"
                styleClass="modern-table"
              >

                <ng-template pTemplate="header">

                  <tr>
                    <th>Пользователь</th>
                    <th>Статус</th>
                    <th>Вероятность</th>
                    <th>Риск</th>
                    <th>Друзья</th>
                    <th>Подписчики</th>
                    <th>Посты</th>
                    <th>Аватар</th>
                    <th>Причины</th>
                  </tr>

                </ng-template>

                <ng-template pTemplate="body" let-item>

                  <tr>

                    <td>

                      <div class="user-cell">

                        <div class="avatar-small">

                          @if (item.profile_info?.avatar_url) {

                            <img
                              [src]="item.profile_info?.avatar_url"
                              alt="avatar"
                              loading="lazy"
                              referrerpolicy="no-referrer"
                            />

                          } @else {

                            <i class="pi pi-user"></i>

                          }

                        </div>

                        <div class="user-meta">

                          <div class="user-name">
                            {{
                              item.profile_info?.full_name
                              || 'Неизвестный'
                            }}
                          </div>

                          <div class="user-id">
                            {{ item.vk_id || '-' }}
                          </div>

                        </div>

                      </div>

                    </td>

                    <td>

                      <p-tag
                        [value]="
                          item.label === 'FAKE'
                            ? 'ФЕЙК'
                            : 'РЕАЛЬНЫЙ'
                        "
                        [severity]="
                          item.label === 'FAKE'
                            ? 'danger'
                            : 'success'
                        "
                      ></p-tag>

                    </td>

                    <td>

                      <div class="probability-block">

                        <div class="probability-value">
                          {{
                            (item.probability * 100)
                              | number:'1.0-1'
                          }}%
                        </div>

                        <p-progressBar
                          [value]="item.probability * 100"
                          [showValue]="false"
                          styleClass="mini-progress"
                        ></p-progressBar>

                      </div>

                    </td>

                    <td>

                      <div
                        class="risk-badge"
                        [ngClass]="{
                          high: item.risk_level === 'HIGH',
                          medium: item.risk_level === 'MEDIUM',
                          low: item.risk_level === 'LOW'
                        }"
                      >
                        {{ riskRu(item.risk_level) }}
                      </div>

                    </td>

                    <td>
                      {{ item.features?.['friends_count'] ?? 0 }}
                    </td>

                    <td>
                      {{ item.features?.['followers_count'] ?? 0 }}
                    </td>

                    <td>
                      {{ item.features?.['posts_count'] ?? 0 }}
                    </td>

                    <td>

                      <div
                        class="avatar-state"
                        [ngClass]="{
                          yes: item.profile_info?.has_avatar,
                          no: !item.profile_info?.has_avatar
                        }"
                      >
                        {{
                          item.profile_info?.has_avatar
                            ? 'Есть'
                            : 'Нет'
                        }}
                      </div>

                    </td>

                    <td>

                      <div class="reasons-column">

                        @if (item.reasons?.length) {

                          @for (
                            reason of item.reasons.slice(0, 3);
                            track reason
                          ) {

                            <div class="reason-chip">
                              {{ reasonRu(reason) }}
                            </div>

                          }

                        } @else {

                          <div class="reason-chip success-chip">
                            Нет подозрений
                          </div>

                        }

                      </div>

                    </td>

                  </tr>

                </ng-template>

              </p-table>

            </div>

          </div>

        }

      </p-card>

  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      color: white;
    }

    .bg-glow {
      position: absolute;
      border-radius: 999px;
      filter: blur(90px);
      opacity: .18;
      pointer-events: none;
    }

    .glow-1 {
      width: 320px;
      height: 320px;
      background: #3b82f6;
      top: -80px;
      left: -100px;
    }

    .glow-2 {
      width: 300px;
      height: 300px;
      background: #8b5cf6;
      bottom: 0;
      right: -80px;
    }

    .main-card {
      overflow: hidden;
      border-radius: 32px;
      background: rgba(15,23,42,.72);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,.08);
      box-shadow:
        0 25px 80px rgba(0,0,0,.45);
    }

    .hero {
      padding: 2.5rem 2.5rem 1rem;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      padding: .6rem 1rem;
      border-radius: 999px;
      background: rgba(59,130,246,.12);
      border: 1px solid rgba(59,130,246,.22);
      color: #93c5fd;
      margin-bottom: 1.2rem;
      font-size: .92rem;
      font-weight: 600;
    }

    .hero h1 {
      margin: 0;
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -1px;
    }

    .hero p {
      margin-top: 1rem;
      max-width: 720px;
      color: #94a3b8;
      line-height: 1.7;
      font-size: 1.05rem;
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
      height: 58px;
      padding-left: 3rem !important;
      border-radius: 18px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      color: white;
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
      padding: 1rem 1.2rem;
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

    .content {
      padding: 0 2.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .top-grid {
      display: grid;
      grid-template-columns: 450px 1fr;
      gap: 1.5rem;
      align-items: stretch;
    }

    .glass-card {
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

    .card-title {
      display: flex;
      align-items: center;
      gap: .75rem;
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .summary-column {
      display: grid;
      gap: 1rem;
    }

    .summary-card {
      border-radius: 24px;
      padding: 1.4rem;
      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,.06),
          rgba(255,255,255,.03)
        );
      border: 1px solid rgba(255,255,255,.08);
    }

    .summary-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .summary-value {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
      line-height: 1;
    }

    .real-card .summary-value {
      color: #4ade80;
    }

    .fake-card .summary-value {
      color: #f87171;
    }

    .suspicious-card .summary-value {
      color: #fbbf24;
    }

    .table-wrapper {
      overflow: hidden;
      border-radius: 28px;
      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,.06),
          rgba(255,255,255,.03)
        );
      border: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(12px);
    }

    .table-header {
      padding: 1.5rem 1.5rem 0;
    }

    .table-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .table-header p {
      margin-top: .5rem;
      color: #94a3b8;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 220px;
    }

    .avatar-small {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      overflow: hidden;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .avatar-small img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .user-name {
      font-weight: 700;
    }

    .user-id {
      color: #60a5fa;
      font-size: .9rem;
      margin-top: .3rem;
    }

    .probability-block {
      min-width: 120px;
    }

    .probability-value {
      font-weight: 700;
      margin-bottom: .4rem;
    }

    .risk-badge {
      padding: .45rem .8rem;
      border-radius: 999px;
      font-size: .85rem;
      font-weight: 700;
      width: fit-content;
    }

    .risk-badge.high {
      background: rgba(239,68,68,.15);
      color: #fca5a5;
    }

    .risk-badge.medium {
      background: rgba(245,158,11,.15);
      color: #fcd34d;
    }

    .risk-badge.low {
      background: rgba(34,197,94,.15);
      color: #86efac;
    }

    .avatar-state {
      padding: .45rem .8rem;
      border-radius: 999px;
      font-size: .85rem;
      font-weight: 700;
      width: fit-content;
    }

    .avatar-state.yes {
      background: rgba(34,197,94,.15);
      color: #86efac;
    }

    .avatar-state.no {
      background: rgba(239,68,68,.15);
      color: #fca5a5;
    }

    .reasons-column {
      display: flex;
      flex-direction: column;
      gap: .5rem;
      min-width: 220px;
    }

    .reason-chip {
      padding: .55rem .85rem;
      border-radius: 12px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.05);
      font-size: .85rem;
    }

    .success-chip {
      background: rgba(34,197,94,.12);
      color: #86efac;
    }

    ::ng-deep .modern-table {
      background: transparent;
    }

    ::ng-deep .modern-table .p-datatable-table {
      background: transparent;
    }

    ::ng-deep .modern-table th {
      background: rgba(255,255,255,.04);
      color: #94a3b8;
      border: none;
      padding: 1rem;
      font-weight: 600;
    }

    ::ng-deep .modern-table td {
      background: transparent;
      border: none;
      padding: 1rem;
      color: #fff;
      border-top: 1px solid rgba(255,255,255,.05);
    }

    ::ng-deep .modern-table tr:hover td {
      background: rgba(255,255,255,.03);
    }

    @media (max-width: 1200px) {

      .top-grid {
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
    }
  `],
})
export class FollowersAnalyzerPageComponent {

  vkId = '';
  loading = false;

  items: AnalyzeResponse[] = [];

  summary?: {
    real_percent: number;
    fake_percent: number;
    suspicious_percent: number;
  };

  pieData: any = {};

  chartOptions: any = {
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
          },
        },
      },
    },
  };

  errorText = '';

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
    this.summary = undefined;
    this.items = [];

    this.api
      .analyzeFollowers(this.vkId.trim())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (res) => {

          console.log('FOLLOWERS RESPONSE:', res);

          this.items = (res.items ?? []).map(item => ({
            ...item,
            reasons: item?.reasons ?? [],
            features: item?.features ?? {},
            profile_info: item?.profile_info ?? {},
          }));

          this.summary = res.summary;

          this.pieData = {
            labels: [
              'Реальные',
              'Фейки',
              'Подозрительные',
            ],
            datasets: [
              {
                data: [
                  res.summary.real_percent,
                  res.summary.fake_percent,
                  res.summary.suspicious_percent,
                ],
                backgroundColor: [
                  '#22c55e',
                  '#ef4444',
                  '#f59e0b',
                ],
                borderWidth: 0,
              },
            ],
          };

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(err);

          this.errorText =
            err?.error?.detail
            ?? 'Ошибка анализа подписчиков';

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
        'Мало друзей',

      'No profile avatar':
        'Нет аватара',

      'New account':
        'Новый аккаунт',

      'Very low posting activity':
        'Низкая активность',

      'Unusual followers/friends ratio':
        'Подозрительное соотношение',

      'Combined ML risk signals':
        'Комбинированный риск',
    };

    return map[reason] ?? reason;
  }
}