import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AuthService } from './services/auth.service';

import {
  logOut,
  logIn,
  personAdd,
  menu,
  personCircle,
  business,
  addCircle,
  clipboard,
  apps,
  eye
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ...IONIC_IMPORTS],
})
export class AppComponent implements OnInit {
  currentUser: any = null;
  appPages: any[] = [];

  constructor(private authService: AuthService, private router: Router) {
    addIcons({
      logOut,
      logIn,
      personAdd,
      menu,
      personCircle,
      business,
      addCircle,
      clipboard,
      apps,
      eye
    });
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      console.log('👤 Usuario actual:', user);
      this.actualizarMenu();
    });
  }

  // ==========================================
  // 🔵 MENÚ DINÁMICO SEGÚN SESIÓN Y ROL
  // ==========================================
  actualizarMenu() {
    // 👉 OPCIÓN A — Mostrar Registrar Empresa SOLO sin sesión
    if (!this.currentUser) {
      this.appPages = [
        { title: 'Login', url: '/login', icon: 'log-in' },
        { title: 'Registro Usuario', url: '/registro', icon: 'person-add' },
        { title: 'Registrar Empresa', url: '/registro-empresa', icon: 'business' }  // 🔥 AGREGADO
      ];
      return;
    }

    // 👉 SESIÓN INICIADA
    switch (this.currentUser.role) {
      case 'adm_empresa':
        this.appPages = [
          { title: 'Menú Empresa', url: '/menu-emp', icon: 'briefcase' },
          { title: 'Publicar Servicio', url: '/publicar-servicio', icon: 'add-circle' },
          { title: 'Servicio', url: '/servicio', icon: 'clipboard' }
        ];
        break;

      case 'adm':
        this.appPages = [
          { title: 'Menú Admin', url: '/menu-adm', icon: 'apps' }
        ];
        break;

      case 'usuario':
      default:
        this.appPages = [
          { title: 'Menú', url: '/menu', icon: 'menu' },
          { title: 'Perfil de Usuario', url: '/perfil-usuario', icon: 'person-circle' }
        ];
        break;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
