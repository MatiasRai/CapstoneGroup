import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
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
    IonContent, IonHeader, IonTitle, IonToolbar, IonList,
    IonItem, IonLabel, IonInput, IonButton,
    CommonModule, FormsModule, IONIC_IMPORTS
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
    toast.present();
  }

  onLogin() {
    if (!this.credenciales.correo || !this.credenciales.contrasena) {
      this.presentToast('Completa todos los campos', 'warning');
      return;
    }

    this.loginService.login(this.credenciales).subscribe({
      next: (res) => {
        this.authService.login(res); // ✅ guardamos el usuario
        this.presentToast(res.message, 'success');
        console.log('✅ Usuario logeado:', res);

        // Redirección según el rol
        if (res.role === 'adm_empresa') {
          window.location.href = '/menu-emp';
        } else if (res.role === 'adm') {
          window.location.href = '/menu-adm';
        } else {
          window.location.href = '/menu';
        }
      },
      error: (err) => {
        this.presentToast(err.error.error || 'Usuario o contraseña incorrectos', 'danger');
      }
    });
  }
}
