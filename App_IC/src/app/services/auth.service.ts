import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 🔧 CORREGIDO: Cambiar de 'usuarioLogeado' a 'user' para que coincida con los guards
  private readonly LS_KEY = 'user';
  private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  constructor() {}

  // 🔹 Guardar usuario
  login(user: any) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  // 🔹 Obtener usuario actual
  getUser() {
    return this.userSubject.value;
  }

  // 🔹 Leer usuario almacenado (inicio app)
  private getUserFromStorage() {
    const data = localStorage.getItem(this.LS_KEY);
    return data ? JSON.parse(data) : null;
  }

  // 🔹 Cerrar sesión
  logout() {
    localStorage.removeItem(this.LS_KEY);
    this.userSubject.next(null);
    window.location.href = '/login';
  }

  // 🔹 Verificar sesión
  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}