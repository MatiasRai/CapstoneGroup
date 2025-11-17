import { Routes } from '@angular/router';
import { AuthUserGuard } from './guards/auth-user.guard';
import { AuthAdmGuard } from './guards/auth-adm.guard';
import { AuthEmpresaGuard } from './guards/auth-empresa.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'menu', // 🔹 Ahora va directo al menú principal
    pathMatch: 'full',
  },

  // 🔹 Autenticación
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then(m => m.RegistroPage)
  },

  // 👤 Usuario normal - YA NO REQUIERE AUTENTICACIÓN para ver
  {
    path: 'menu',
    loadComponent: () => import('./menu/menu.page').then(m => m.MenuPage)
    // ✅ Sin canActivate - accesible sin login
  },

  // 📋 Perfil de usuario - SÍ requiere autenticación
  {
    path: 'perfil-usuario',
    loadComponent: () => import('./perfil-usuario/perfil-usuario.page').then(m => m.PerfilUsuarioPage),
    canActivate: [AuthUserGuard]
  },

  // 👨‍💻 Administrador del sistema
  {
    path: 'menu-adm',
    loadComponent: () => import('./menu-adm/menu-adm.page').then(m => m.MenuADMPage),
    canActivate: [AuthAdmGuard]
  },

  // 🏢 Administrador de empresa
  {
    path: 'menu-emp',
    loadComponent: () => import('./menu-emp/menu-emp.page').then(m => m.MenuEMPPage),
    canActivate: [AuthEmpresaGuard]
  },
  {
    path: 'publicar-servicio',
    loadComponent: () => import('./publicar-servicio/publicar-servicio.page').then(m => m.PublicarServicioPage),
    canActivate: [AuthEmpresaGuard]
  },
  {
    path: 'servicio',
    loadComponent: () => import('./servicio/servicio.page').then(m => m.ServicioPage),
    canActivate: [AuthEmpresaGuard]
  },

  // 📋 Otros formularios o registros
  {
    path: 'registro-adm-empresa',
    loadComponent: () => import('./registro-adm-empresa/registro-adm-empresa.page').then(m => m.RegistroAdmEmpresaPage)
  },
  {
    path: 'registro-empresa',
    loadComponent: () => import('./registro-empresa/registro-empresa.page').then(m => m.RegistroEmpresaPage)
  },

  // ❌ Si la ruta no existe, redirige al menú principal
  {
    path: '**',
    redirectTo: 'menu'
  },
  {
    path: 'info-servicio',
    loadComponent: () => import('./info-servicio/info-servicio.page').then( m => m.InfoServicioPage)
  }

];
