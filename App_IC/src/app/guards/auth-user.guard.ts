import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthUserGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user && user.role === 'usuario') {
      return true; // ✅ Usuario autenticado
    }

    // ❌ No es usuario → lo mando al login
    this.router.navigate(['/login']);
    return false;
  }
}
