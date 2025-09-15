
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterLink, IonRouterOutlet],
})
export class AppComponent {
  appPages = [
    { title: 'Login', url: '/login', icon: 'log-in' },
    { title: 'Registro', url: '/registro', icon: 'person-add' },
    { title: 'Menu', url: '/menu', icon: 'menu' },
    { title: 'Registro Empresa', url: '/registro-empresa', icon: 'business' },
    { title: 'Publicar Servicio', url: '/publicar-servicio', icon: 'add-circle' },
    { title: 'Servicio', url: '/servicio', icon: 'clipboard' },
    { title: 'Menu Admin', url: '/menu-adm', icon: 'apps' },
    { title: 'Menu Empresa', url: '/menu-emp', icon: 'briefcase' },
    { title: 'Login Empresa', url: '/login-emp', icon: 'log-in' }
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor() {
    addIcons({ mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp });
  }
}
