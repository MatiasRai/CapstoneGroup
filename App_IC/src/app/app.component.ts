import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import * as icons from 'ionicons/icons';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AuthService } from './services/auth.service';

addIcons(icons);

import {
  logOut,
  logIn,
  personAdd,
  menu,
  personCircle,
  business,
  addCircle,
  clipboard,
  globe,
  locate,
  navigateCircle,
  apps,
  eye,
  informationCircle,
  arrowBack
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
      eye,
      informationCircle,
      globe,
      locate,
      navigateCircle
    });
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.actualizarMenu();
    });
  }

  // ==========================================
  //  MENÚ DINÁMICO SEGÚN SESIÓN Y ROL
  // ==========================================
  actualizarMenu() {

    
    const infoApp = {
      title: 'Información de la App',
      url: '/info-app',
      icon: 'information-circle'
    };

    //  NO HAY SESIÓN INICIADA
    if (!this.currentUser) {
      this.appPages = [
        { title: 'Login', url: '/login', icon: 'log-in' },
        { title: 'Registro Usuario', url: '/registro', icon: 'person-add' },

        //  AGREGAMOS → Registro Admin Empresa
        { title: 'Registro Adm Empresa', url: '/registro-adm-empresa', icon: 'business' },

        infoApp
      ];
      return;
    }

    //  SESIÓN INICIADA
    switch (this.currentUser.role) {

      case 'adm_empresa':
        this.appPages = [
          { title: 'Menú Empresa', url: '/menu-emp', icon: 'briefcase' },
          { title: 'Publicar Servicio', url: '/publicar-servicio', icon: 'add-circle' },
          { title: 'Servicio', url: '/servicio', icon: 'clipboard' },
          infoApp
        ];
        break;

      case 'adm':
        this.appPages = [
          { title: 'Menú Admin', url: '/menu-adm', icon: 'apps' },
          infoApp
        ];
        break;

      case 'usuario':
      default:
        this.appPages = [
          { title: 'Menú', url: '/menu', icon: 'menu' },
          { title: 'Perfil de Usuario', url: '/perfil-usuario', icon: 'person-circle' },
          infoApp
        ];
        break;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
