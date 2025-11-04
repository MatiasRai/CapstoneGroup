import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from '../services/adm-empresa.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-publicar-servicio',
  templateUrl: './publicar-servicio.page.html',
  styleUrls: ['./publicar-servicio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ...IONIC_IMPORTS]
})
export class PublicarServicioPage implements OnInit {
  servicio = {
    nombre_servicio: '',
    descripcion_servicio: '',
    horario_disponible: '',
    costo_servicio: '',
    direccion: '', // 👈 agregado
    Lugares_id_lugar: null,
    Empresas_id_empresa: null,
    id_discapacidad: null,
    foto_referencia: '' // 👈 opcional, para guardar nombre o ruta del archivo
  };

  selectedFile: File | null = null;

  constructor(
    private admEmpresaService: AdmEmpresaService,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const usuario = this.authService.getUser();
    if (usuario?.id) {
      this.servicio.Empresas_id_empresa = usuario.id;
    }
  }

  // 👇 Captura el archivo seleccionado (imagen)
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.servicio.foto_referencia = file.name; // guarda el nombre (puedes cambiar a ruta si subes la imagen)
      console.log('📸 Archivo seleccionado:', file.name);
    }
  }

  registrarServicio() {
    console.log('📤 Datos enviados al backend:', this.servicio);

    if (!this.servicio.nombre_servicio || !this.servicio.descripcion_servicio) {
      this.mostrarToast('Completa todos los campos obligatorios.', 'danger');
      return;
    }

    this.admEmpresaService.publicarServicio(this.servicio).subscribe({
      next: (res) => {
        console.log('✅ Servicio registrado:', res);
        this.mostrarToast('Servicio registrado correctamente.', 'success');
        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('❌ Error al registrar servicio:', err);
        this.mostrarToast('Error al registrar el servicio.', 'danger');
      }
    });
  }

  limpiarFormulario() {
    this.servicio = {
      nombre_servicio: '',
      descripcion_servicio: '',
      horario_disponible: '',
      costo_servicio: '',
      direccion: '',
      Lugares_id_lugar: null,
      Empresas_id_empresa: this.authService.getUser()?.id || null,
      id_discapacidad: null,
      foto_referencia: ''
    };
    this.selectedFile = null;
  }

  async mostrarToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }
}
