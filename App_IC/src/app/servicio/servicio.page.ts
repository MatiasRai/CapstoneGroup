import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from '../services/adm-empresa.service';
import { AuthService } from '../services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-servicio',
  templateUrl: './servicio.page.html',
  styleUrls: ['./servicio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ...IONIC_IMPORTS],
})
export class ServicioPage implements OnInit {
  servicios: any[] = [];
  cargando = true;
  empresa: any = null;

  constructor(
    private admEmpresaService: AdmEmpresaService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.cargarServicios();
  }

  /* ======================================================
     🔄 Cargar servicios de la empresa logueada
  ====================================================== */
  cargarServicios() {
    const usuario = this.authService.getUser();
    if (!usuario?.id) {
      this.mostrarToast('No se encontró una sesión activa.', 'danger');
      return;
    }

    this.cargando = true;

    // 1️⃣ Obtener la empresa asociada al admin logueado
    this.admEmpresaService.obtenerEmpresaPorAdm(usuario.id).subscribe({
      next: (res: any) => {
        this.empresa = Array.isArray(res) ? res[0] : res;

        if (!this.empresa?.id_empresa) {
          this.cargando = false;
          this.mostrarToast('No se encontró una empresa asociada.', 'warning');
          return;
        }

        // 2️⃣ Obtener servicios de esa empresa
        this.admEmpresaService.obtenerServiciosPorEmpresa(this.empresa.id_empresa).subscribe({
          next: (data: any) => {
            this.servicios = Array.isArray(data) ? data : [];
            this.cargando = false;
            console.log('🧾 Servicios cargados:', this.servicios);
          },
          error: (err) => {
            console.error('❌ Error al obtener servicios:', err);
            this.cargando = false;
            this.mostrarToast('Error al cargar los servicios.', 'danger');
          },
        });
      },
      error: (err) => {
        console.error('❌ Error al obtener empresa:', err);
        this.cargando = false;
      },
    });
  }

  /* ======================================================
     ✏️ Editar Servicio
  ====================================================== */
  async editarServicio(servicio: any) {
    const alerta = await this.alertCtrl.create({
      header: 'Editar Servicio',
      inputs: [
        { name: 'nombre_servicio', type: 'text', value: servicio.nombre_servicio, placeholder: 'Nombre del servicio' },
        { name: 'descripcion_servicio', type: 'text', value: servicio.descripcion_servicio, placeholder: 'Descripción' },
        { name: 'horario_disponible', type: 'text', value: servicio.horario_disponible, placeholder: 'Horario disponible' },
        { name: 'costo_servicio', type: 'number', value: servicio.costo_servicio, placeholder: 'Costo (CLP)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const host = window.location.hostname;
            const url = `http://${host}:3000/api/v1/servicios/${servicio.id_servicio}`;

            this.http.put(url, data).subscribe({
              next: () => {
                console.log(`✏️ Servicio ${servicio.id_servicio} actualizado`);
                this.mostrarToast('Servicio actualizado correctamente.', 'success');
                this.cargarServicios(); // ✅ recarga automática
              },
              error: (err) => {
                console.error('❌ Error al actualizar servicio:', err);
                this.mostrarToast('Error al actualizar servicio.', 'danger');
              },
            });
          },
        },
      ],
    });
    await alerta.present();
  }

  /* ======================================================
     🗑️ Eliminar Servicio
  ====================================================== */
  async eliminarServicio(id: number) {
    const alerta = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Seguro que deseas eliminar este servicio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            const host = window.location.hostname;
            const url = `http://${host}:3000/api/v1/servicios/${id}`;

            this.http.delete(url).subscribe({
              next: () => {
                console.log(`🗑️ Servicio ${id} eliminado`);
                this.mostrarToast('Servicio eliminado correctamente.', 'success');
                this.cargarServicios(); // ✅ recarga automática
              },
              error: (err) => {
                console.error('❌ Error al eliminar servicio:', err);
                this.mostrarToast('Error al eliminar servicio.', 'danger');
              },
            });
          },
        },
      ],
    });
    await alerta.present();
  }

  /* ======================================================
     🔔 Toast Helper
  ====================================================== */
  async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
