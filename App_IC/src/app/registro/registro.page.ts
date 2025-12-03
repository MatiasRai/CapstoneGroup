import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonInput, IonItem, IonLabel, IonList,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { ToastController } from '@ionic/angular';   // 👈 NUEVO
import { UsuarioService } from '../services/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonInput, IonItem, IonLabel, IonList,
    IonSelect, IonSelectOption,
    CommonModule, FormsModule, IONIC_IMPORTS
  ]
})
export class RegistroPage implements OnInit {

  usuario = {
    nombre: '',
    correo: '',
    contrasena: '',
    celular: '',
    foto_perfil: '',
    Discapacidades_id_discapacidad: null
  };

  fotoFile: File | null = null;
  discapacidades: any[] = [];

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private toastController: ToastController      // 👈 NUEVO
  ) {}

  ngOnInit() {
    this.usuarioService.getDiscapacidades().subscribe({
      next: (data) => {
        this.discapacidades = data;
      },
      error: (err) => {
        console.error('Error cargando discapacidades:', err);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    this.fotoFile = file ?? null;
    this.usuario.foto_perfil = this.fotoFile ? this.fotoFile.name : '';
  }

  // 🔔 Toast reutilizable
  private async mostrarToast(
    header: string,
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary'
  ) {
    const toast = await this.toastController.create({
      header,
      message,
      color,
      duration: 2500,
      position: 'top',
      icon: color === 'success' ? 'checkmark-circle' : 'alert-circle'
    });

    await toast.present();
  }

  // 👇 Ahora sin alert(), solo toasts bonitos
  onRegistrar() {
    this.usuarioService.registrarUsuario(this.usuario).subscribe({
      next: async (res: any) => {
        console.log('Usuario creado:', res);

        await this.mostrarToast(
          'Registro exitoso 🎉',
          'Tu cuenta se creó correctamente. Ahora puedes iniciar sesión.',
          'success'
        );

        this.router.navigate(['/login']);
      },
      error: async (err) => {
        console.error('Error al registrar usuario:', err);

        await this.mostrarToast(
          'Error al registrar',
          'No se pudo crear la cuenta. Inténtalo nuevamente.',
          'danger'
        );
      }
    });
  }
}
