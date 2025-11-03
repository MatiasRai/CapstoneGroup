import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AuthService } from './services/auth.service';
import {
  logOut,
  bookmarkOutline,
  bookmarkSharp,
  logIn,
  personAdd,
  menu,
  business,
  addCircle,
  clipboard,
  apps,
  briefcase
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ...IONIC_IMPORTS],
})
export class AppComponent {
  currentUser: any = null;

  appPages = [
    { title: 'Login', url: '/login', icon: 'log-in' },
    { title: 'Registro', url: '/registro', icon: 'person-add' },
    { title: 'Menu', url: '/menu', icon: 'menu' },
    { title: 'Perfil de Usuario', url: '/perfil-usuario', icon: 'person-circle' },
    { title: 'Registro Empresa', url: '/registro-empresa', icon: 'business' },
    { title: 'Publicar Servicio', url: '/publicar-servicio', icon: 'add-circle' },
    { title: 'Servicio', url: '/servicio', icon: 'clipboard' },
    { title: 'Menu Admin', url: '/menu-adm', icon: 'apps' },
    { title: 'Menu Empresa', url: '/menu-emp', icon: 'briefcase' }
  ];

  labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

  constructor(private authService: AuthService, private router: Router) {
    addIcons({
      logOut,
      logIn,
      personAdd,
      menu,
      business,
      addCircle,
      clipboard,
      apps,
      briefcase,
      bookmarkOutline,
      bookmarkSharp
    });
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}