import { Component, OnInit } from '@angular/core';
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
export class MenuADMPage implements OnInit {
  usuarios: any[] = [];
  empresas: any[] = [];

  constructor(
    private usuarioService: UsuarioService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarEmpresas();
  }

  // 🔹 Mostrar notificación
  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  // ==================== USUARIOS ====================
  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  eliminarUsuario(id: number) {
    this.usuarioService.deleteUsuario(id).subscribe(() => {
      this.usuarios = this.usuarios.filter(u => u.id_usuario !== id);
      this.presentToast('✅ Usuario eliminado correctamente');
    });
  }

  // ==================== EMPRESAS ====================
  cargarEmpresas() {
    this.usuarioService.getEmpresas().subscribe(data => {
      this.empresas = data;
    });
  }

  cambiarEstado(id: number, estado: string) {
    this.usuarioService.updateEstadoEmpresa(id, estado).subscribe(() => {
      const empresa = this.empresas.find(e => e.id_empresa === id);
      if (empresa) empresa.estado = estado;
      this.presentToast(`✅ Estado actualizado a ${estado}`);
    });
  }

  eliminarEmpresa(id: number) {
    if (!confirm('¿Seguro que deseas eliminar esta empresa?')) return;

    this.usuarioService.deleteEmpresa(id).subscribe({
      next: () => {
        // ✅ Eliminar del array local para reflejar en tiempo real
        this.empresas = this.empresas.filter(e => e.id_empresa !== id);
        this.presentToast('✅ Empresa eliminada correctamente');
      },
      error: (err) => {
        console.error('❌ Error al eliminar empresa:', err);
        this.presentToast('❌ Error al eliminar empresa', 'danger');
      }
    });
  }
}
