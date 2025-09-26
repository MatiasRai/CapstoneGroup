import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthEmpresaGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === 'adm_empresa') {
        return true; // ✅ acceso permitido
      }
    }

    // ❌ no tiene rol de administrador de empresa
    this.router.navigate(['/login']);
    return false;
  }
}
