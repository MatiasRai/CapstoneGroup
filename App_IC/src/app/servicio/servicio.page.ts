import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from '../services/adm-empresa.service';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-servicio',
  templateUrl: './servicio.page.html',
  styleUrls: ['./servicio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ...IONIC_IMPORTS]
})
export class ServicioPage implements OnInit {
  servicios: any[] = [];
  cargando = true;

  constructor(
    private admEmpresaService: AdmEmpresaService,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargarServicios();
  }

  // 🔹 Obtener los servicios creados por la empresa logeada
  cargarServicios() {
    const usuario = this.authService.getUser();
    if (!usuario?.id) {
      this.mostrarToast('No se encontró una sesión activa.', 'danger');
      return;
    }

    this.admEmpresaService.obtenerServiciosPorEmpresa(usuario.id).subscribe({
      next: (data: any) => {
        this.servicios = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al obtener servicios:', err);
        this.cargando = false;
        this.mostrarToast('Error al cargar los servicios.', 'danger');
      }
    });
  }

  // 🔹 Mostrar mensajes al usuario
  async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
