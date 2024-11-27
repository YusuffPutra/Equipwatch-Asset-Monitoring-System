import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RoleGuard } from './role-guard.guard'; // Import RoleGuard
import { AboutComponent } from './about/about.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component'; // Import UnauthorizedComponent
import { EmailVerificationComponent } from './email-verification/email-verification.component';
import { PatternLockComponent } from './pattern-lock/pattern-lock.component';

// Admin Components
import { ManageToolsComponent } from './admin/manage-tools/manage-tools.component';
import { ToolsLocationComponent } from './admin/tools-location/tools-location.component';
import { SetAlertsComponent } from './admin/set-alerts/set-alerts.component';
import { ToolUsageHistoryComponent } from './admin/tool-usage-history/tool-usage-history.component';
import { AdminDashboardComponent } from './admin/dashboard/dashboard.component';

// User Components
import { ViewToolComponent } from './user/view-tool/view-tool.component';
import { UserToolUsageHistoryComponent } from './user/user-tool-usage-history/user-tool-usage-history.component';
import { UserDashboardComponent } from './user/dashboard/dashboard.component';

const routes: Routes = [
  // Home route
  { path: '', component: HomeComponent },

  // Login route
  { path: 'login', component: LoginComponent },

  // Logout route
  { path: 'logout', component: LogoutComponent },

  // About route
  { path: 'about', component: AboutComponent },

  // Pattern Lock route (set or verify)
  { path: 'pattern-lock', component: PatternLockComponent },

  // Email Verification route
  { path: 'email-verification', component: EmailVerificationComponent },

  // Admin Routes
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [RoleGuard],
    data: { role: 'admin' }, // Restrict to admin role
  },
  {
    path: 'admin/manage-tools',
    component: ManageToolsComponent,
    canActivate: [RoleGuard],
    data: { role: 'admin' }, // Restrict to admin role
  },
  {
    path: 'admin/tools-location',
    component: ToolsLocationComponent,
    canActivate: [RoleGuard],
    data: { role: 'admin' }, // Restrict to admin role
  },
  {
    path: 'admin/set-alerts',
    component: SetAlertsComponent,
    canActivate: [RoleGuard],
    data: { role: 'admin' }, // Restrict to admin role
  },
  {
    path: 'admin/tool-usage-history',
    component: ToolUsageHistoryComponent,
    canActivate: [RoleGuard],
    data: { role: 'admin' }, // Restrict to admin role
  },

  // User Routes
  {
    path: 'user/dashboard',
    component: UserDashboardComponent,
    canActivate: [RoleGuard],
    data: { role: 'user' }, // Restrict to user role
  },
  {
    path: 'user/view-tool',
    component: ViewToolComponent,
    canActivate: [RoleGuard],
    data: { role: 'user' }, // Restrict to user role
  },
  {
    path: 'user/user-tool-usage-history',
    component: UserToolUsageHistoryComponent,
    canActivate: [RoleGuard],
    data: { role: 'user' }, // Restrict to user role
  },

  // Unauthorized Route
  { path: 'unauthorized', component: UnauthorizedComponent },

  // Wildcard Route (Redirect to Home if route not found)
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
