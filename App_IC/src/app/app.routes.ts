import { Routes } from '@angular/router';
import { AuthUserGuard } from './guards/auth-user.guard';
import { AuthAdmGuard } from './guards/auth-adm.guard';
import { AuthEmpresaGuard } from './guards/auth-empresa.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',   // 👈 mejor redirigir a login
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then(m => m.RegistroPage)
  },

  // 👤 Usuario normal
  {
    path: 'menu',
    loadComponent: () => import('./menu/menu.page').then(m => m.MenuPage)
    
  },
  {
    path: 'publicar-servicio',
    loadComponent: () => import('./publicar-servicio/publicar-servicio.page').then(m => m.PublicarServicioPage),
    canActivate: [AuthUserGuard]
  },
  {
    path: 'servicio',
    loadComponent: () => import('./servicio/servicio.page').then(m => m.ServicioPage),
    canActivate: [AuthUserGuard]
  },

  // 👨‍💻 Administrador sistema
  {
    path: 'menu-adm',
    loadComponent: () => import('./menu-adm/menu-adm.page').then(m => m.MenuADMPage),
    canActivate: [AuthAdmGuard]
  },

  // 🏢 Administrador empresa
  {
    path: 'menu-emp',
    loadComponent: () => import('./menu-emp/menu-emp.page').then(m => m.MenuEMPPage),
    canActivate: [AuthEmpresaGuard]
  },

  {
    path: 'registro-adm-empresa',
    loadComponent: () => import('./registro-adm-empresa/registro-adm-empresa.page').then(m => m.RegistroAdmEmpresaPage)
  },
  {
    path: 'registro-empresa',
    loadComponent: () => import('./registro-empresa/registro-empresa.page').then(m => m.RegistroEmpresaPage)
  },
];
