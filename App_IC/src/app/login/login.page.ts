import { Component } from '@angular/core';
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
  IonInput,
  IonButton
} from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from 'src/app/services/adm-empresa.service';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    CommonModule,
    FormsModule,
    IONIC_IMPORTS
  ]
})
export class LoginPage {
  credenciales = { correo: '', contrasena: '' };

  constructor(
    private loginService: AdmEmpresaService,
    private toastCtrl: ToastController,
    private authService: AuthService
  ) {}

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }

  onLogin() {
    if (!this.credenciales.correo || !this.credenciales.contrasena) {
      this.presentToast('Completa todos los campos', 'warning');
      return;
    }

    this.loginService.login(this.credenciales).subscribe({
      next: (res) => {
        // ✅ Normalizar el ID sin importar el tipo de usuario
        const id =
          res.id ||
          res.id_adm_empresa ||
          res.id_usuario ||
          res.id_adm ||
          null;

        if (res && id) {
          // Normalizamos el objeto antes de guardar
          const usuario = { ...res, id };

          // ✅ Guardar usuario logeado en localStorage
          localStorage.setItem('usuarioLogeado', JSON.stringify(usuario));
          console.log('✅ Usuario guardado en localStorage:', usuario);

          this.presentToast(res.message, 'success');

          // ✅ Redirección según el rol
          if (res.role === 'adm_empresa') {
            window.location.href = '/menu-emp';
          } else if (res.role === 'adm') {
            window.location.href = '/menu-adm';
          } else {
            window.location.href = '/menu';
          }
        } else {
          // Si no hay ID, muestra mensaje
          console.warn('⚠️ Respuesta del servidor sin ID:', res);
          this.presentToast('Respuesta inválida del servidor', 'danger');
        }
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        this.presentToast(
          err.error?.error || 'Usuario o contraseña incorrectos',
          'danger'
        );
      }
    });
  }
}
