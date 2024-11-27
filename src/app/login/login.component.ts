import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; // Import AuthService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public email: string = ''; // User email input
  public password: string = ''; // User password input
  public errorMessage: string = ''; // Error message display

  constructor(private authService: AuthService) {}

  // Login Method
  login() {
    this.authService
      .login(this.email, this.password) // Call AuthService login method
      .then(() => {
        console.log('Login successful!');
        // Navigation (based on pattern setup and role) is handled in AuthService
      })
      .catch(error => {
        this.handleLoginError(error); // Handle login errors
      });
  }

  // Handle Login Errors
  private handleLoginError(error: any) {
    switch (error.code) {
      case 'auth/user-not-found':
        this.errorMessage = 'No user found with this email.';
        break;
      case 'auth/wrong-password':
        this.errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/too-many-requests':
        this.errorMessage = 'Too many login attempts. Try again later.';
        break;
      default:
        this.errorMessage = 'Login failed. Please try again.';
    }
    console.error('Login error:', error);
  }
}
