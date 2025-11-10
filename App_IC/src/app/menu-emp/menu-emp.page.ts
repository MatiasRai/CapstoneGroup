import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from '../services/adm-empresa.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-menu-emp',
  templateUrl: './menu-emp.page.html',
  styleUrls: ['./menu-emp.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IONIC_IMPORTS]
})
export class MenuEMPPage implements OnInit {

  empresa: any = null;
  servicios: any[] = [];

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private admEmpresaService: AdmEmpresaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  /* ======================================================
     🔄 Cargar Empresa y Servicios
  ====================================================== */
  cargarDatosIniciales() {
    const usuario = this.authService.getUser();
    if (!usuario?.id) {
      console.warn('⚠️ No se encontró usuario logeado en localStorage');
      return;
    }

    const idAdm = usuario.id;

    // ✅ 1. Obtener empresa vinculada al admin
    this.admEmpresaService.obtenerEmpresaPorAdm(idAdm).subscribe({
      next: (res) => {
        this.empresa = Array.isArray(res) ? res[0] : res;
        console.log('🏢 Empresa cargada:', this.empresa);

        // ✅ 2. Obtener servicios asociados
        if (this.empresa?.id_empresa) {
          this.cargarServicios(this.empresa.id_empresa);
        }
      },
      error: (err) => console.error('❌ Error al obtener empresa:', err)
    });
  }

  cargarServicios(id_empresa: number) {
    this.admEmpresaService.obtenerServiciosPorEmpresa(id_empresa).subscribe({
      next: (res) => {
        this.servicios = Array.isArray(res) ? res : [];
        console.log('🧾 Servicios cargados:', this.servicios);
      },
      error: (err) => {
        console.error('❌ Error al obtener servicios:', err);
        this.servicios = [];
      }
    });
  }

  /* ======================================================
     🗑️ Eliminar Servicio (Recarga Automática)
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
                this.cargarServicios(this.empresa.id_empresa); // ✅ Recarga automática
              },
              error: (err) => {
                console.error('❌ Error al eliminar servicio:', err);
                this.mostrarToast('Error al eliminar servicio.', 'danger');
              }
            });
          }
        }
      ]
    });
    await alerta.present();
  }

  /* ======================================================
     ✏️ Editar Empresa
  ====================================================== */
  async editarEmpresa(empresa: any) {
    const alerta = await this.alertCtrl.create({
      header: 'Editar Empresa',
      inputs: [
        { name: 'nombre_empresa', type: 'text', value: empresa.nombre_empresa, placeholder: 'Nombre' },
        { name: 'direccion_empresa', type: 'text', value: empresa.direccion_empresa, placeholder: 'Dirección' },
        { name: 'telefono', type: 'text', value: empresa.telefono, placeholder: 'Teléfono' },
        { name: 'Correo', type: 'text', value: empresa.Correo, placeholder: 'Correo' },
        { name: 'descripcion_empresa', type: 'text', value: empresa.descripcion_empresa, placeholder: 'Descripción' },
        { name: 'horarios', type: 'text', value: empresa.horarios, placeholder: 'Horarios' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const host = window.location.hostname;
            const url = `http://${host}:3000/api/v1/empresas/${empresa.id_empresa}`;

            this.http.put(url, data).subscribe({
              next: () => {
                console.log(`✏️ Empresa ${empresa.id_empresa} actualizada`);
                this.mostrarToast('Empresa actualizada correctamente.', 'success');
                this.cargarDatosIniciales(); // ✅ Refresca todo
              },
              error: (err) => {
                console.error('❌ Error al actualizar empresa:', err);
                this.mostrarToast('Error al actualizar empresa.', 'danger');
              }
            });
          }
        }
      ]
    });
    await alerta.present();
  }

  /* ======================================================
     ✏️ Editar Servicio (Recarga Automática)
  ====================================================== */
  async editarServicio(servicio: any) {
    const alerta = await this.alertCtrl.create({
      header: 'Editar Servicio',
      inputs: [
        { name: 'nombre_servicio', type: 'text', value: servicio.nombre_servicio, placeholder: 'Nombre del servicio' },
        { name: 'descripcion_servicio', type: 'text', value: servicio.descripcion_servicio, placeholder: 'Descripción' },
        { name: 'horario_disponible', type: 'text', value: servicio.horario_disponible, placeholder: 'Horario disponible' },
        { name: 'costo_servicio', type: 'number', value: servicio.costo_servicio, placeholder: 'Costo' }
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
                this.cargarServicios(this.empresa.id_empresa); // ✅ Recarga automática
              },
              error: (err) => {
                console.error('❌ Error al actualizar servicio:', err);
                this.mostrarToast('Error al actualizar servicio.', 'danger');
              }
            });
          }
        }
      ]
    });
    await alerta.present();
  }

  /* ======================================================
     🔔 Toast Helper
  ====================================================== */
  async mostrarToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
