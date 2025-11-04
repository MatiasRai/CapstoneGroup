import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthAdmGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userData = localStorage.getItem('usuarioLogeado'); // ✅ clave correcta
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === 'adm') { // ✅ el rol correcto para admin del sistema
        return true;
      }
    }

    // ❌ Si no es admin, lo saca
    this.router.navigate(['/login']);
    return false;
  }
}
