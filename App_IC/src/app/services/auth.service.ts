import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly LS_KEY = 'user';
  private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  constructor() {
    this.applyAccessibilitySettings();
  }

  login(user: any) {
    const userData = {
      id: user.id,
      correo: user.correo,
      role: user.role,
      font_size: user.font_size ?? 16,
      high_contrast: user.high_contrast ?? 0,
      discapacidad: user.discapacidad ?? null
    };

    localStorage.setItem(this.LS_KEY, JSON.stringify(userData));
    this.userSubject.next(userData);
    this.applyAccessibilitySettings();
  }

  getUser() {
    return this.userSubject.value;
  }

  private getUserFromStorage() {
    const data = localStorage.getItem(this.LS_KEY);
    return data ? JSON.parse(data) : null;
  }

  applyAccessibilitySettings() {
    const user = this.getUser();
    if (!user) return;

    const fontSize = user.font_size ?? 16;
    const highContrast = user.high_contrast ?? 0;

    document.documentElement.style.setProperty('--app-font-size', fontSize + 'px');

    if (highContrast === 1) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  logout() {
    localStorage.removeItem(this.LS_KEY);
    this.userSubject.next(null);
    document.documentElement.style.setProperty('--app-font-size', '16px');
    document.body.classList.remove('high-contrast');
    window.location.href = '/login';
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  tieneDiscapacidadVisual(): boolean {
    const user = this.getUser();
    if (!user || !user.discapacidad) return false;
    
    const tipoDiscapacidad = user.discapacidad.tipo_discapacidad || '';
    return tipoDiscapacidad.toLowerCase().includes('visual');
  }

  // Temporal para compartir datos de navegación de ruta
  private rutaNavegacionTemporal: any = null;

  setRutaNavegacion(ruta: any) {
    this.rutaNavegacionTemporal = ruta;
  }

  getRutaNavegacion() {
    const ruta = this.rutaNavegacionTemporal;
    this.rutaNavegacionTemporal = null; // Limpiar después de obtener
    return ruta;
  }
}