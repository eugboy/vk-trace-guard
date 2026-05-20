import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <div class="app-shell">

      <div class="bg-glow glow-1"></div>
      <div class="bg-glow glow-2"></div>

      <header class="topbar">

        <div class="brand">

          <div class="logo">
            <i class="pi pi-shield"></i>
          </div>

          <div>

            <h1>TraceGuard VK</h1>

            <p>
              Система анализа цифрового следа ВКонтакте
            </p>

          </div>

        </div>

        <nav class="nav">

          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{
              exact: true
            }"
          >
            <i class="pi pi-chart-line"></i>
            <span>Дашборд</span>
          </a>

          <a
            routerLink="/account"
            routerLinkActive="active"
          >
            <i class="pi pi-user"></i>
            <span>Анализ пользователя</span>
          </a>

        </nav>

      </header>

      <main class="content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(
          circle at top left,
          #172554 0%,
          transparent 30%
        ),
        radial-gradient(
          circle at bottom right,
          #1e1b4b 0%,
          transparent 30%
        ),
        #0b1120;
      color: white;
      overflow-x: hidden;
    }

    * {
      box-sizing: border-box;
    }

    .app-shell {
      position: relative;
      min-height: 100vh;
      padding: 2rem;
      max-width: 1800px;
      margin: 0 auto;
    }

    .bg-glow {
      position: fixed;
      border-radius: 999px;
      filter: blur(100px);
      opacity: .16;
      pointer-events: none;
      z-index: 0;
    }

    .glow-1 {
      width: 340px;
      height: 340px;
      background: #3b82f6;
      top: -120px;
      left: -120px;
    }

    .glow-2 {
      width: 300px;
      height: 300px;
      background: #8b5cf6;
      right: -80px;
      bottom: -80px;
    }

    .topbar {
      position: sticky;
      top: 1.5rem;
      z-index: 50;

      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;

      margin-bottom: 2rem;
      padding: 1.3rem 1.5rem;

      border-radius: 28px;

      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,.06),
          rgba(255,255,255,.03)
        );

      border: 1px solid rgba(255,255,255,.08);

      backdrop-filter: blur(20px);

      box-shadow:
        0 20px 60px rgba(0,0,0,.35);
    }

    .topbar::before {
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
      border-radius: inherit;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 1;
    }

    .logo {
      width: 64px;
      height: 64px;
      border-radius: 22px;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 1.6rem;

      background:
        linear-gradient(
          135deg,
          rgba(59,130,246,.2),
          rgba(139,92,246,.2)
        );

      border: 1px solid rgba(255,255,255,.08);

      color: #93c5fd;

      box-shadow:
        0 10px 30px rgba(59,130,246,.18);
    }

    .brand h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -.5px;
      line-height: 1;
    }

    .brand p {
      margin: .45rem 0 0;
      color: #94a3b8;
      font-size: .95rem;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: .75rem;
      flex-wrap: wrap;
      z-index: 1;
    }

    .nav a {
      position: relative;

      display: inline-flex;
      align-items: center;
      gap: .65rem;

      padding: .9rem 1.1rem;

      border-radius: 16px;

      text-decoration: none;

      color: #94a3b8;

      font-weight: 600;
      font-size: .95rem;

      transition:
        all .25s ease;

      border: 1px solid transparent;
    }

    .nav a i {
      font-size: 1rem;
    }

    .nav a:hover {
      color: white;

      background:
        rgba(255,255,255,.05);

      border-color:
        rgba(255,255,255,.08);

      transform:
        translateY(-1px);
    }

    .nav a.active {
      color: white;

      background:
        linear-gradient(
          135deg,
          rgba(59,130,246,.18),
          rgba(139,92,246,.18)
        );

      border-color:
        rgba(96,165,250,.22);

      box-shadow:
        0 10px 30px rgba(59,130,246,.15);
    }

    .content {
      position: relative;
      z-index: 1;
    }

    @media (max-width: 1100px) {

      .topbar {
        flex-direction: column;
        align-items: flex-start;
      }

      .nav {
        width: 100%;
      }
    }

    @media (max-width: 768px) {

      .app-shell {
        padding: 1rem;
      }

      .topbar {
        top: 1rem;
        padding: 1.2rem;
        border-radius: 24px;
      }

      .brand {
        align-items: flex-start;
      }

      .brand h1 {
        font-size: 1.5rem;
      }

      .brand p {
        font-size: .88rem;
      }

      .nav {
        gap: .6rem;
      }

      .nav a {
        flex: 1 1 calc(50% - .6rem);
        justify-content: center;
      }

      .logo {
        width: 58px;
        height: 58px;
      }
    }

    @media (max-width: 520px) {

      .nav a {
        flex: 1 1 100%;
      }
    }
  `],
})
export class AppComponent {}