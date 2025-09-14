import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'menu',
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
    path: 'servicio',
    loadComponent: () => import('./servicio/servicio.page').then( m => m.ServicioPage)
  },
  {
    path: 'menu-adm',
    loadComponent: () => import('./menu-adm/menu-adm.page').then( m => m.MenuADMPage)
  },
  {
    path: 'menu-emp',
    loadComponent: () => import('./menu-emp/menu-emp.page').then( m => m.MenuEMPPage)
  },
  {
    path: 'login-emp',
    loadComponent: () => import('./login-emp/login-emp.page').then( m => m.LoginEMPPage)
  },
];
