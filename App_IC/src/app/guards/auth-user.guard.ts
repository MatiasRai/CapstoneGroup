import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthUserGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const raw = localStorage.getItem('user');

    if (!raw) {
      console.warn('🚫 [AuthUserGuard] No hay usuario en localStorage');
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const user = JSON.parse(raw);
      console.log('🟢 [AuthUserGuard] Usuario detectado:', user);

      if (user.role === 'usuario') {
        console.log('✅ [AuthUserGuard] Acceso permitido');
        return true;
      } else {
        console.warn('🚫 [AuthUserGuard] Rol no autorizado:', user.role);
      }
    } catch (error) {
      console.error('❌ [AuthUserGuard] Error al parsear usuario:', error);
    }

    this.router.navigate(['/login']);
    return false;
  }
}
