import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';

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

  constructor(private http: HttpClient, private alertCtrl: AlertController) {}

  ngOnInit() {
    this.recargarDatos(); // Cargar empresa y servicios al iniciar
  }

  // 🔄 Cargar empresa y sus servicios
  recargarDatos() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogeado') || '{}');
    if (!usuario?.id) {
      console.warn('⚠️ No se encontró usuario logeado en localStorage');
      return;
    }

    const id = usuario.id;

    // 🏢 Obtener datos de la empresa
    this.http.get(`http://localhost:3000/api/v1/empresas/admin/${id}`).subscribe({
      next: (res) => (this.empresa = res),
      error: (err) => console.error('❌ Error al obtener empresa:', err)
    });

    // 🧾 Obtener servicios de la empresa
    this.http.get(`http://localhost:3000/api/v1/empresas/admin/${id}/servicios`).subscribe({
      next: (res: any) => {
        this.servicios = res;
        console.log('🧾 Servicios cargados:', res);
      },
      error: (err) => {
        console.error('❌ Error al obtener servicios:', err);
        this.servicios = [];
      }
    });
  }

  // 🗑️ Eliminar servicio
  async eliminarServicio(id: number) {
    const alerta = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Seguro que deseas eliminar este servicio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.http.delete(`http://localhost:3000/api/v1/empresas/servicios/${id}`).subscribe({
              next: () => {
                console.log(`🗑️ Servicio ${id} eliminado`);
                this.recargarDatos();
              },
              error: (err) => console.error('❌ Error al eliminar servicio:', err)
            });
          }
        }
      ]
    });
    await alerta.present();
  }
// ✏️ Editar empresa
async editarEmpresa(empresa: any) {
  const alerta = await this.alertCtrl.create({
    header: 'Editar Empresa',
    inputs: [
      { name: 'nombre_empresa', type: 'text', value: empresa.nombre_empresa, placeholder: 'Nombre' },
      { name: 'direccion_empresa', type: 'text', value: empresa.direccion_empresa, placeholder: 'Dirección' },
      { name: 'telefono', type: 'text', value: empresa.telefono, placeholder: 'Teléfono' },
      { name: 'correo', type: 'text', value: empresa.correo, placeholder: 'Correo' },
      { name: 'descripcion_empresa', type: 'text', value: empresa.descripcion_empresa, placeholder: 'Descripción' },
      { name: 'horarios', type: 'text', value: empresa.horarios, placeholder: 'Horarios' }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: (data) => {
          this.http.put(`http://localhost:3000/api/v1/empresas/${empresa.id_empresa}`, data).subscribe({
            next: () => {
              console.log(`✏️ Empresa ${empresa.id_empresa} actualizada`);
              this.recargarDatos();
            },
            error: (err) => console.error('❌ Error al actualizar empresa:', err)
          });
        }
      }
    ]
  });
  await alerta.present();
}

  // ✏️ Editar servicio + lugar + discapacidad
  async editarServicio(servicio: any) {
    const alerta = await this.alertCtrl.create({
      header: 'Editar Servicio',
      inputs: [
        { name: 'nombre_servicio', type: 'text', value: servicio.nombre_servicio, placeholder: 'Nombre del servicio' },
        { name: 'descripcion_servicio', type: 'text', value: servicio.descripcion_servicio, placeholder: 'Descripción' },
        { name: 'horario_disponible', type: 'text', value: servicio.horario_disponible, placeholder: 'Horario disponible' },
        { name: 'costo_servicio', type: 'number', value: servicio.costo_servicio, placeholder: 'Costo' },

        // 🏠 Lugar
        { name: 'nombre_lugar', type: 'text', value: servicio.nombre_lugar, placeholder: 'Nombre del lugar' },
        { name: 'direccion_lugar', type: 'text', value: servicio.direccion_lugar, placeholder: 'Dirección del lugar' },

        // 🧩 Discapacidad
        { name: 'nombre_discapacidad', type: 'text', value: servicio.nombre_discapacidad, placeholder: 'Tipo de discapacidad' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            console.log("📝 Enviando datos de actualización:", data);
            this.http.put(`http://localhost:3000/api/v1/empresas/servicios/${servicio.id_servicio}`, data).subscribe({
              next: () => {
                console.log(`✏️ Servicio ${servicio.id_servicio} actualizado correctamente`);
                this.recargarDatos();
              },
              error: (err) => console.error('❌ Error al actualizar servicio:', err)
            });
          }
        }
      ]
    });
    await alerta.present();
  }
}
