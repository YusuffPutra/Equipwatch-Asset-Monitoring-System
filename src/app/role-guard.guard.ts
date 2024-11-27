import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRole = route.data['role']; // Get required role from route

    return this.authService.currentUserRole$.pipe(
      take(1), // Take the latest value
      map((role) => {
        if (role === requiredRole) {
          return true; // Allow access
        } else {
          this.router.navigate(['/unauthorized']); // Redirect to unauthorized
          return false; // Deny access
        }
      })
    );
  }
}
