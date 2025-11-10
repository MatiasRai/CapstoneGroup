import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthEmpresaGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): boolean {
    const user = this.authService.getUser();

    console.log('🟢 [AuthEmpresaGuard] usuario detectado:', user);

    if (user && user.role === 'adm_empresa') {
      console.log('✅ [AuthEmpresaGuard] acceso permitido');
      return true;
    }

    console.warn('🚫 [AuthEmpresaGuard] acceso denegado');
    this.router.navigate(['/login']);
    return false;
  }
}
