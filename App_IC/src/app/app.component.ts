import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  mailSharp,
  paperPlaneOutline,
  paperPlaneSharp,
  heartOutline,
  heartSharp,
  archiveOutline,
  archiveSharp,
  trashOutline,
  trashSharp,
  warningOutline,
  warningSharp,
  bookmarkOutline,
  bookmarkSharp, logOut } from 'ionicons/icons';

import { IONIC_IMPORTS } from 'src/shared/ionic-imports'; // 👈 solo Ionic aquí
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,        // 👈 Para *ngIf y *ngFor
    RouterLink,
    RouterLinkActive,
    ...IONIC_IMPORTS     // 👈 Todos los componentes de Ionic
  ],
})
export class AppComponent {
  currentUser: any = null;

  appPages = [
    { title: 'Login', url: '/login', icon: 'log-in' },
    { title: 'Registro', url: '/registro', icon: 'person-add' },
    { title: 'Menu', url: '/menu', icon: 'menu' },
    { title: 'Registro Empresa', url: '/registro-empresa', icon: 'business' },
    { title: 'Publicar Servicio', url: '/publicar-servicio', icon: 'add-circle' },
    { title: 'Servicio', url: '/servicio', icon: 'clipboard' },
    { title: 'Menu Admin', url: '/menu-adm', icon: 'apps' },
    { title: 'Menu Empresa', url: '/menu-emp', icon: 'briefcase' }
  ];

  labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

  constructor(private authService: AuthService) {
    addIcons({logOut,mailOutline,mailSharp,paperPlaneOutline,paperPlaneSharp,heartOutline,heartSharp,archiveOutline,archiveSharp,trashOutline,trashSharp,warningOutline,warningSharp,bookmarkOutline,bookmarkSharp});
  }

  ngOnInit() {
    this.currentUser = this.authService.getUser();
  }

  logout() {
    this.authService.logout();
    this.currentUser = null;
  }
}
