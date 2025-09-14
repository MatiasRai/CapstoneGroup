import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'folder/inbox',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'menu',
    loadComponent: () => import('./menu/menu.page').then( m => m.MenuPage)
  },
  {
    path: 'registro-empresa',
    loadComponent: () => import('./registro-empresa/registro-empresa.page').then( m => m.RegistroEmpresaPage)
  },
  {
    path: 'publicar-servicio',
    loadComponent: () => import('./publicar-servicio/publicar-servicio.page').then( m => m.PublicarServicioPage)
  },
  {
    path: 'login-empresa',
    loadComponent: () => import('./login-empresa/login-empresa.page').then( m => m.LoginEmpresaPage)
  },
  {
    path: 'servicio',
    loadComponent: () => import('./servicio/servicio.page').then( m => m.ServicioPage)
  },
];
