import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';

import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-menu-adm',
  templateUrl: './menu-adm.page.html',
  styleUrls: ['./menu-adm.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    CommonModule,
    FormsModule,
    IONIC_IMPORTS
  ]
})
export class MenuADMPage implements OnInit, OnDestroy {

  
  usuarios: any[] = [];
  empresas: any[] = [];

  
  usuarioPage: number = 1;
  usuarioLimit: number = 10;
  usuarioTotalPages: number = 1;

  
  empresaPage: number = 1;
  empresaLimit: number = 10;
  empresaTotalPages: number = 1;

  
  isMobile: boolean = false;
  resizeListener: any;

  constructor(
    private usuarioService: UsuarioService,
    private toastCtrl: ToastController
  ) {}

  
  ngOnInit() {
    this.detectarResponsive();
    this.addResizeListener();

    this.cargarUsuarios();
    this.cargarEmpresas();
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  
  detectarResponsive() {
    this.isMobile = window.innerWidth < 768;
  }

  addResizeListener() {
    this.resizeListener = () => {
      this.isMobile = window.innerWidth < 768;
    };
    window.addEventListener('resize', this.resizeListener);
  }

  
  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  
  cargarUsuarios() {
    this.usuarioService
      .getUsuariosPaginados(this.usuarioPage, this.usuarioLimit)
      .subscribe({
        next: (data) => {
          this.usuarios = data.data;
          this.usuarioTotalPages = data.totalPages;
        },
        error: () => {
          this.presentToast("Error al cargar usuarios", "danger");
        }
      });
  }

  usuariosAnterior() {
    if (this.usuarioPage > 1) {
      this.usuarioPage--;
      this.cargarUsuarios();
    }
  }

  usuariosSiguiente() {
    if (this.usuarioPage < this.usuarioTotalPages) {
      this.usuarioPage++;
      this.cargarUsuarios();
    }
  }

  eliminarUsuario(id: number) {
    this.usuarioService.deleteUsuario(id).subscribe({
      next: () => {
        this.presentToast("Usuario eliminado");
        this.cargarUsuarios(); // refrescar página
      },
      error: () => {
        this.presentToast("Error al eliminar usuario", "danger");
      }
    });
  }

  
  cargarEmpresas() {
    this.usuarioService
      .getEmpresasPaginadas(this.empresaPage, this.empresaLimit)
      .subscribe({
        next: (data) => {
          this.empresas = data.data;
          this.empresaTotalPages = data.totalPages;
        },
        error: () => {
          this.presentToast("Error al cargar empresas", "danger");
        }
      });
  }

  empresasAnterior() {
    if (this.empresaPage > 1) {
      this.empresaPage--;
      this.cargarEmpresas();
    }
  }

  empresasSiguiente() {
    if (this.empresaPage < this.empresaTotalPages) {
      this.empresaPage++;
      this.cargarEmpresas();
    }
  }

  cambiarEstado(id: number, estado: string) {
    this.usuarioService.updateEstadoEmpresa(id, estado).subscribe({
      next: () => {
        this.presentToast(`Estado actualizado a "${estado}"`);
        this.cargarEmpresas();
      },
      error: () => {
        this.presentToast("Error al actualizar estado", "danger");
      }
    });
  }

  eliminarEmpresa(id: number) {
    if (!confirm("¿Seguro que deseas eliminar esta empresa?")) return;

    this.usuarioService.deleteEmpresa(id).subscribe({
      next: () => {
        this.presentToast("Empresa eliminada");
        this.cargarEmpresas();
      },
      error: () => {
        this.presentToast("Error al eliminar empresa", "danger");
      }
    });
  }
}
