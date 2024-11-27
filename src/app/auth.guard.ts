import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const currentUrl = route.routeConfig?.path;

    return this.authService.user$.pipe(
      map((user) => {
        const isAuthenticated = !!user;
        const isEmailVerified = user?.emailVerified ?? false;
        const isPatternAuthenticated = user?.patternSet ?? false; // Ensure pattern is set

        return { isAuthenticated, isEmailVerified, isPatternAuthenticated };
      }),
      tap(({ isAuthenticated, isEmailVerified, isPatternAuthenticated }) => {
        if (!isAuthenticated) {
          this.router.navigate(['/login']); // Redirect unauthenticated user
        } else if (!isPatternAuthenticated && currentUrl !== 'pattern-lock') {
          this.router.navigate(['/pattern-lock']); // Redirect if pattern not authenticated
        } else if (!isEmailVerified && currentUrl !== 'email-verification') {
          this.router.navigate(['/email-verification']); // Redirect if email not verified
        }
      }),
      map(
        ({ isAuthenticated, isEmailVerified, isPatternAuthenticated }) =>
          isAuthenticated && isPatternAuthenticated && (isEmailVerified || currentUrl === 'email-verification'),
      ),
    );
  }
}
