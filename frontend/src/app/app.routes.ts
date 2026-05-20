import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { AccountAnalyzerPageComponent } from './pages/account-analyzer-page.component';

export const appRoutes: Routes = [
  { path: '', component: DashboardPageComponent },
  { path: 'account', component: AccountAnalyzerPageComponent },
];
