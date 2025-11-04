import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthEmpresaGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // ✅ Leer el usuario guardado correctamente
    const userData = localStorage.getItem('usuarioLogeado');
    if (userData) {
      const user = JSON.parse(userData);
      // ✅ Verificar que sea administrador de empresa
      if (user.role === 'adm_empresa') {
        return true;
      }
    }

    // ❌ No tiene sesión o no es administrador de empresa
    this.router.navigate(['/login']);
    return false;
  }
}
