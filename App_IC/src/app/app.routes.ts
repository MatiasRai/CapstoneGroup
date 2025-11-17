import { Routes } from '@angular/router';
import { AuthUserGuard } from './guards/auth-user.guard';
import { AuthAdmGuard } from './guards/auth-adm.guard';
import { AuthEmpresaGuard } from './guards/auth-empresa.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'menu',
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

  // 👤 Menú público
  {
    path: 'menu',
    loadComponent: () => import('./menu/menu.page').then(m => m.MenuPage)
  },

  // 📋 Perfil usuario (requiere login)
  {
    path: 'perfil-usuario',
    loadComponent: () =>
      import('./perfil-usuario/perfil-usuario.page').then(m => m.PerfilUsuarioPage),
    canActivate: [AuthUserGuard]
  },

  // 👨‍💻 Panel Administrador del sistema
  {
    path: 'menu-adm',
    loadComponent: () => import('./menu-adm/menu-adm.page').then(m => m.MenuADMPage),
    canActivate: [AuthAdmGuard]
  },

  // 🏢 Panel Administrador de Empresa
  {
    path: 'menu-emp',
    loadComponent: () => import('./menu-emp/menu-emp.page').then(m => m.MenuEMPPage),
    canActivate: [AuthEmpresaGuard]
  },
  {
    path: 'publicar-servicio',
    loadComponent: () =>
      import('./publicar-servicio/publicar-servicio.page').then(m => m.PublicarServicioPage),
    canActivate: [AuthEmpresaGuard]
  },
  {
    path: 'servicio',
    loadComponent: () =>
      import('./servicio/servicio.page').then(m => m.ServicioPage),
    canActivate: [AuthEmpresaGuard]
  },

  // 📋 Registro de Administrador Empresa
  {
    path: 'registro-adm-empresa',
    loadComponent: () =>
      import('./registro-adm-empresa/registro-adm-empresa.page').then(
        m => m.RegistroAdmEmpresaPage
      )
  },

  // 📋 Registro normal de Empresas (ruta antigua)
  {
    path: 'registro-empresa',
    loadComponent: () =>
      import('./registro-empresa/registro-empresa.page').then(m => m.RegistroEmpresaPage)
  },

  // 🆕 ✔ NUEVA RUTA: Registrar Empresa desde el menú
  {
    path: 'registrar-empresa',
    loadComponent: () =>
      import('./registro-empresa/registro-empresa.page').then(m => m.RegistroEmpresaPage)
    // 🔸 Usa la misma página que registro-empresa
  },

  // ❌ Ruta no encontrada → redirige al menú
  {
    path: '**',
    redirectTo: 'menu'
  }
];
