import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent {
  constructor(private authService: AuthService, private router: Router) {}

  resendVerification() {
    this.authService.sendEmailVerification().then(() => {
      alert('Verification email resent! Please check your inbox.');
    }).catch((error) => {
      console.error('Error sending email verification:', error);
    });
  }

  async checkVerificationStatus() {
    const isVerified = await this.authService.isEmailVerified();
    if (isVerified) {
      // Use getCurrentUserID to fetch the user ID
      const userId = await this.authService.getCurrentUserID();
      if (userId) {
        const role = await this.authService.getUserRole(userId);
        alert('Email verified! Redirecting...');
        // Redirect based on the user role
        if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']); // Redirect admins
        } else {
          this.router.navigate(['/user/dashboard']); // Redirect regular users
        }
      } else {
        alert('Error: Could not retrieve user ID. Redirecting to login.');
        this.router.navigate(['/login']); // Fallback in case of an error
      }
    } else {
      alert('Email is not yet verified. Please check your inbox.');
    }
  }
  

}
