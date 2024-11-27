import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

interface UserData {
  email: string;
  role: string;
  emailVerified: boolean;
  patternSet?: boolean; // New property
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public user$: Observable<UserData | null>;
  public currentUserRole = new BehaviorSubject<string | null>(null);
  public currentUserRole$ = this.currentUserRole.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .collection<UserData>('users')
            .doc(user.uid)
            .valueChanges()
            .pipe(
              map((userData) => {
                if (userData) {
                  this.currentUserRole.next(userData.role || null);
                  return {
                    ...userData,
                    emailVerified: user.emailVerified,
                  };
                }
                return null;
              })
            );
        } else {
          this.currentUserRole.next(null);
          return of(null);
        }
      })
    );
  }

  async login(email: string, password: string) {
    try {
      // Sign in with email and password
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      if (user) {
        console.log('User Logged In:', user.email);
        console.log('Email Verified Status:', user.emailVerified);
  
        // Check if the user has a pattern set in the database
        const isPatternSet = await this.isPatternSet(user.uid);
        console.log('Is Pattern Set:', isPatternSet);
  
        if (!isPatternSet) {
          console.log('Redirecting to pattern setup...');
          this.router.navigate(['/pattern-lock']); // Redirect user to set up a pattern
          return; // Exit here to ensure further logic is paused until pattern is set
        }
  
        // Redirect to pattern authentication if the pattern is already set
        console.log('Redirecting to pattern authentication...');
        this.router.navigate(['/pattern-lock']);
        return; // Exit until pattern authentication is completed
  
        // If the email is not verified, redirect to email verification
        if (!user.emailVerified) {
          console.log('Redirecting to email verification...');
          await this.sendEmailVerification(); // Trigger verification email
          this.router.navigate(['/email-verification']); // Navigate to email verification page
          return; // Stop further processing until email verification is completed
        }
  
        // Finally, navigate based on user role (admin or user)
        console.log('Redirecting to role-specific dashboard...');
        const userRole = await this.getUserRole(user.uid); // Fetch user role
        this.navigateByRole(userRole); // Navigate to the appropriate dashboard
      }
    } catch (error) {
      console.error('Login error:', error);
      this.currentUserRole.next(null); // Reset current user role in case of error
      throw error; // Re-throw the error for the login component to handle
    }
  }
  

  async getUserRole(userId: string): Promise<string | null> {
    try {
      const userDoc = await this.firestore
        .collection<UserData>('users')
        .doc(userId)
        .get()
        .toPromise();
      const userData = userDoc?.data();
      return userData?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  async isPatternSet(userId: string): Promise<boolean> {
    try {
      const userDoc = await this.firestore
        .collection<UserData>('users')
        .doc(userId)
        .get()
        .toPromise();
      const userData = userDoc?.data();
      return userData?.patternSet || false;
    } catch (error) {
      console.error('Error checking if pattern is set:', error);
      return false;
    }
  }

  async logout() {
    await this.afAuth.signOut();
    this.currentUserRole.next(null); // Reset role
    localStorage.clear(); // Clear any locally stored data
    this.router.navigate(['/login']); // Redirect to login
  }
  
  getCurrentUserID(): Promise<string | null> {
    return this.afAuth.currentUser.then((user) => (user ? user.uid : null));
  }

  private navigateByRole(role: string) {
    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'user') {
      this.router.navigate(['/user/dashboard']);
    } else {
      console.error('Unknown role. Redirecting to unauthorized.');
      this.router.navigate(['/unauthorized']);
    }
  }
  

  async sendEmailVerification(): Promise<void> {
    const currentUser = await this.afAuth.currentUser;

    if (currentUser) {
      await currentUser.sendEmailVerification();
      console.log('Verification email sent!');
    } else {
      throw new Error('No user is currently logged in.');
    }
  }

  async isEmailVerified(): Promise<boolean> {
    const currentUser = await this.afAuth.currentUser;
    return currentUser ? currentUser.emailVerified : false;
  }

  async updatePatternSetStatus(userId: string, status: boolean): Promise<void> {
    try {
      await this.firestore
        .collection('users')
        .doc(userId)
        .update({ patternSet: status });
      console.log(`Pattern set status updated to ${status}`);
    } catch (error) {
      console.error('Error updating pattern set status:', error);
    }
  }
}
