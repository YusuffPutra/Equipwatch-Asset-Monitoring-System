import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { RouterModule } from '@angular/router';
import { PatternLockComponent } from './pattern-lock/pattern-lock.component';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ManageToolsComponent } from './admin/manage-tools/manage-tools.component';
import { ToolUsageHistoryComponent } from './admin/tool-usage-history/tool-usage-history.component';
import { ViewToolComponent } from './user/view-tool/view-tool.component';
import { AdminDashboardComponent } from './admin/dashboard/dashboard.component'; // Import AdminDashboardComponent
import { UserDashboardComponent } from './user/dashboard/dashboard.component'; // Import UserDashboardComponent
import { CommonModule } from '@angular/common';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';




@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ManageToolsComponent,
    ToolUsageHistoryComponent,
    ViewToolComponent,
    AdminDashboardComponent,
    UserDashboardComponent,
    PatternLockComponent,
  ],

  imports: [
    BrowserModule,
    FormsModule, // For ngModel
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAnalyticsModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    RouterModule,
    AppRoutingModule,
    CommonModule // Add CommonModule to provide Angular pipes like 'date'
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule {}
