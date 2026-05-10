import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';

import { ApiService } from '../services/api.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    SkeletonModule,
  ],
  template: `


      <section class="hero">

        <div class="hero-badge">
          <i class="pi pi-chart-line"></i>
          AI Dashboard
        </div>

        <h1>Обзор системы анализа</h1>

        <p>
          Метрики модели, история проверок,
          статистика и влияние ML-признаков.
        </p>

      </section>

      @if (loading) {

        <div class="loading-grid">

          <p-skeleton
            height="180px"
            borderRadius="28px"
          ></p-skeleton>

          <p-skeleton
            height="180px"
            borderRadius="28px"
          ></p-skeleton>

          <p-skeleton
            height="480px"
            borderRadius="28px"
          ></p-skeleton>

          <p-skeleton
            height="480px"
            borderRadius="28px"
          ></p-skeleton>

        </div>

      } @else {

        <div class="dashboard-kpi-grid">

          <div class="glass-card kpi-card">

            <div class="kpi-top">

              <div>
                <div class="kpi-title">
                  Точность модели
                </div>

                <div class="kpi-value">
                  {{ accuracy }}
                </div>
              </div>

              <div class="kpi-icon blue">
                <i class="pi pi-bolt"></i>
              </div>

            </div>

            <div class="kpi-label">
              Качество классификации fake/real
            </div>

          </div>

          <div class="glass-card kpi-card">

            <div class="kpi-top">

              <div>
                <div class="kpi-title">
                  Последние анализы
                </div>

                <div class="kpi-value">
                  {{ historyCount }}
                </div>
              </div>

              <div class="kpi-icon purple">
                <i class="pi pi-history"></i>
              </div>

            </div>

            <div class="kpi-label">
              Количество записей в истории
            </div>

          </div>

        </div>

        <div class="dashboard-chart-grid">

          <div class="glass-card chart-card">

            <div class="card-title">
              <i class="pi pi-sliders-h"></i>
              Важность признаков
            </div>

            <div class="chart-wrap">

              <p-chart
                type="bar"
                [data]="barData"
                [options]="barChartOptions"
              ></p-chart>

            </div>

          </div>

          <div class="glass-card chart-card">

            <div class="card-title">
              <i class="pi pi-chart-line"></i>
              История анализов
            </div>

            <div class="chart-wrap">

              <p-chart
                type="line"
                [data]="lineData"
                [options]="lineChartOptions"
              ></p-chart>

            </div>

          </div>

        </div>

      }

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
      right: -80px;
      bottom: 0;
    }

    .hero {
      margin-bottom: 2rem;
      padding: 2.5rem;
      border-radius: 32px;
      position: relative;
      overflow: hidden;
      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,.06),
          rgba(255,255,255,.03)
        );
      border: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(20px);
      box-shadow:
        0 25px 80px rgba(0,0,0,.45);
    }

    .hero::before {
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

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(320px,1fr));
      gap: 1.5rem;
    }

    .dashboard-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(320px,1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .dashboard-chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(500px,1fr));
      gap: 1.5rem;
    }

    .glass-card {
      position: relative;
      overflow: hidden;
      border-radius: 30px;
      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,.06),
          rgba(255,255,255,.03)
        );
      border: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(20px);
      box-shadow:
        0 25px 60px rgba(0,0,0,.35);
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

    .kpi-card {
      padding: 1.8rem;
    }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .kpi-title {
      color: #94a3b8;
      font-size: .95rem;
      margin-bottom: .75rem;
    }

    .kpi-value {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -1px;
    }

    .kpi-label {
      margin-top: 1rem;
      color: #94a3b8;
      font-size: .95rem;
    }

    .kpi-icon {
      width: 70px;
      height: 70px;
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      flex-shrink: 0;
    }

    .kpi-icon.blue {
      background: rgba(59,130,246,.15);
      color: #60a5fa;
      border: 1px solid rgba(59,130,246,.25);
    }

    .kpi-icon.purple {
      background: rgba(139,92,246,.15);
      color: #c4b5fd;
      border: 1px solid rgba(139,92,246,.25);
    }

    .chart-card {
      padding: 1.5rem;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: .75rem;
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .chart-wrap {
      height: 430px;

      p-chart canvas {
        height: 430px;
      }
    }

    @media (max-width: 900px) {

      .dashboard-chart-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {

      .page {
        padding: 1rem;
      }

      .hero {
        padding: 2rem 1.5rem;
      }

      .hero h1 {
        font-size: 2.2rem;
      }

      .kpi-value {
        font-size: 2.4rem;
      }

      .chart-wrap {
        height: 320px;
      }
    }
  `],
})
export class DashboardPageComponent implements OnInit {

  loading = true;

  accuracy = '-';
  historyCount = 0;

  barData: any = {};
  lineData: any = {};

  barChartOptions = {
    maintainAspectRatio: false,
    responsive: true,

    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: {
            size: 13,
          },
        },
      },

      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },

    scales: {

      x: {
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
          },
        },

        grid: {
          color: 'rgba(255,255,255,.06)',
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          color: '#94a3b8',
        },

        grid: {
          color: 'rgba(255,255,255,.06)',
        },
      },
    },
  };

  lineChartOptions = {
    maintainAspectRatio: false,
    responsive: true,

    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
        },
      },

      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },

    scales: {

      x: {
        ticks: {
          color: '#94a3b8',
        },

        grid: {
          color: 'rgba(255,255,255,.05)',
        },
      },

      y: {
        min: 0,
        max: 1,

        ticks: {
          color: '#94a3b8',
          stepSize: 0.1,
        },

        grid: {
          color: 'rgba(255,255,255,.05)',
        },
      },
    },
  };

  constructor(
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {

    this.api.metrics().subscribe((metrics) => {

      const keys = Object.keys(
        metrics.feature_importance
      );

      const values = Object.values(
        metrics.feature_importance
      );

      this.accuracy =
        typeof metrics.accuracy === 'number'
          ? `${(metrics.accuracy * 100).toFixed(1)}%`
          : 'Нет данных';

      this.barData = {

        labels: keys.map(
          key => this.featureLabelRu(key)
        ),

        datasets: [
          {
            label: 'Влияние признака',

            data: values,

            backgroundColor: [
              '#3b82f6',
              '#60a5fa',
              '#818cf8',
              '#8b5cf6',
              '#06b6d4',
              '#0ea5e9',
              '#38bdf8',
              '#2563eb',
            ],

            borderRadius: 10,
            borderSkipped: false,
            barThickness: 28,
          },
        ],
      };

      this.loading = false;
    });

    this.api.history().subscribe((items) => {

      this.historyCount = items.length;

      this.lineData = {

        labels: items.map(
          (_, i) => `#${items.length - i}`
        ),

        datasets: [
          {
            label: 'Вероятность фейка',

            data: items.map(
              x => x.probability
            ),

            borderColor: '#22d3ee',

            backgroundColor:
              'rgba(34,211,238,.16)',

            tension: .4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      };
    });
  }

  featureLabelRu(key: string): string {

    const map: Record<string, string> = {

      followers_count:
        'Подписчики',

      friends_count:
        'Друзья',

      posts_count:
        'Посты',

      groups_count:
        'Группы',

      account_age_days:
        'Возраст',

      has_avatar:
        'Аватар',

      bio_filled:
        'Био',

      followers_friends_ratio:
        'Соотношение',
    };

    return map[key] ?? key;
  }
}