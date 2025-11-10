import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly LS_KEY = 'user';
  private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  constructor() {}

  login(user: any) {
    console.log('💾 Guardando usuario:', user);
    localStorage.setItem(this.LS_KEY, JSON.stringify(user));
    this.userSubject.next(user); // 👈 asegura refresco inmediato
  }

  getUser() {
    return this.userSubject.value;
  }

  private getUserFromStorage() {
    const data = localStorage.getItem(this.LS_KEY);
    return data ? JSON.parse(data) : null;
  }

  logout() {
    localStorage.removeItem(this.LS_KEY);
    this.userSubject.next(null);
    window.location.href = '/login';
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}
