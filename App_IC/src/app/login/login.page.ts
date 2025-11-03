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
import { Router } from '@angular/router';

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
    private authService: AuthService,
    private router: Router
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
        if (!res?.id) {
          this.presentToast('Respuesta inválida del servidor', 'danger');
          return;
        }

        // ✅ Guardar usuario en AuthService
        this.authService.login(res);

        this.presentToast(res.message || 'Login correcto', 'success');

        // ✅ Redirección según el rol
        if (res.role === 'adm_empresa') {
          this.router.navigate(['/menu-emp']);
        } else if (res.role === 'adm') {
          this.router.navigate(['/menu-adm']);
        } else {
          this.router.navigate(['/menu']);
        }
      },
      error: (err) => {
        console.error('Error en login:', err);
        this.presentToast(
          err?.error?.error || 'Usuario o contraseña incorrectos',
          'danger'
        );
      }
    });
  }
}
