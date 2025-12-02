import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthAdmGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userData = localStorage.getItem('user'); 

    if (userData) {
      const user = JSON.parse(userData);

      console.log('🟢 [AuthAdmGuard] Usuario detectado:', user);

      if (user.role === 'adm') {
        console.log('✅ [AuthAdmGuard] Acceso permitido');
        return true;
      } else {
        console.warn('🚫 [AuthAdmGuard] Rol no autorizado:', user.role);
      }
    } else {
      console.warn('⚠️ [AuthAdmGuard] No se encontró usuario en localStorage');
    }

    
    this.router.navigate(['/login']);
    return false;
  }
}
