import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: any = null;

  constructor() {
    // ✅ Unificamos la clave
    const savedUser = localStorage.getItem('usuarioLogeado');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  // ✅ Guarda el usuario logeado
  login(user: any) {
    this.currentUser = user;
    localStorage.setItem('usuarioLogeado', JSON.stringify(user));
  }

  // ✅ Cierra sesión y redirige al login
  logout() {
    this.currentUser = null;
    localStorage.removeItem('usuarioLogeado');
    window.location.href = '/login';
  }

  // ✅ Retorna el usuario actual
  getUser() {
    return this.currentUser;
  }

  // ✅ Verifica si hay sesión activa
  isLoggedIn(): boolean {
    return !!(this.currentUser && this.currentUser.id);
  }
}
