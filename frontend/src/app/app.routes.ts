import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { AccountAnalyzerPageComponent } from './pages/account-analyzer-page.component';
import { FollowersAnalyzerPageComponent } from './pages/followers-analyzer-page.component';
import { CommunityAnalyzerPageComponent } from './pages/community-analyzer-page.component';

export const appRoutes: Routes = [
  { path: '', component: DashboardPageComponent },
  { path: 'account', component: AccountAnalyzerPageComponent },
  { path: 'followers', component: FollowersAnalyzerPageComponent },
  { path: 'community', component: CommunityAnalyzerPageComponent },
];
