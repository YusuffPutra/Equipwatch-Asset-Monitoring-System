import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isEmailVerificationPage: boolean = false; // Tracks if the user is on the email verification page

  constructor(private router: Router, public authService: AuthService) {}

  ngOnInit(): void {
    try {
      const auth = getAuth(); // Initialize Firebase Auth
      console.log('Firebase Auth initialized:', auth);
    } catch (error) {
      console.error('Error initializing Firebase Auth:', error);
    }
  
    this.router.events.subscribe(() => {
      // Specify the routes where the navbar should not be displayed
      const hiddenRoutes = ['/email-verification', '/pattern-lock'];
  
      // Check if the current route matches any hidden routes
      this.isEmailVerificationPage = hiddenRoutes.includes(this.router.url);
    });
  }
  

  restrictAccess(event: Event): void {
    if (this.isEmailVerificationPage) {
      event.preventDefault(); // Prevent default link behavior
      alert('Access restricted. Please verify your email to proceed.');
      this.router.navigate(['/unauthorized']); // Redirect to unauthorized page
    }
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
