import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AuthService } from '../services/auth.service';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ...IONIC_IMPORTS],
})
export class PerfilUsuarioPage implements OnInit {

  usuario: any = {};
  discapacidades: any[] = [];
  rutasGuardadas: any[] = [];
  resenasUsuario: any[] = [];
  cargando = false;

  fontSize: number = 16;
  isHighContrast: boolean = false;

  private baseHost = window.location.hostname;
  private apiUsuarios = `http://${this.baseHost}:3000/api/v1/usuarios`;
  private apiDiscapacidades = `http://${this.baseHost}:3000/api/v1/discapacidades`;
  private apiRutas = `http://${this.baseHost}:3000/api/v1/rutas`;
  private apiResenas = `http://${this.baseHost}:3000/api/v1/resenas`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.cargarPerfil();
    this.cargarDiscapacidades();
    this.cargarRutasGuardadas();
    this.cargarResenasUsuario();
    this.cargarAccesibilidad();
  }

  cargarAccesibilidad() {
    const user = this.authService.getUser();
    if (!user) return;

    this.fontSize = user.font_size ?? 16;
    this.isHighContrast = user.high_contrast == 1;

    this.authService.applyAccessibilitySettings();
  }

  guardarAccesibilidad() {
    const user = this.authService.getUser();
    if (!user) return;

    this.http.put(
      `${this.apiUsuarios}/${user.id}/accesibilidad`,
      {
        font_size: this.fontSize,
        high_contrast: this.isHighContrast ? 1 : 0
      }
    ).subscribe(() => {
      const updated = {
        ...user,
        font_size: this.fontSize,
        high_contrast: this.isHighContrast ? 1 : 0
      };

      this.authService.login(updated);
    });
  }

  changeFontSize(event: any) {
    const size = event.detail.value;
    this.fontSize = size;

    document.documentElement.style.setProperty('--app-font-size', size + 'px');

    this.guardarAccesibilidad();
  }

  toggleContrast() {
    if (this.isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    this.guardarAccesibilidad();
  }

  cargarPerfil() {
    const user = this.authService.getUser();
    if (!user) {
      this.mostrarToast('No se encontró usuario logueado', 'warning');
      return;
    }

    this.cargando = true;
    this.http.get(`${this.apiUsuarios}/${user.id}`).subscribe({
      next: (data: any) => {
        this.usuario = data;
        this.cargando = false;
      },
      error: () => {
        this.mostrarToast('Error al cargar perfil', 'danger');
        this.cargando = false;
      }
    });
  }

  cargarDiscapacidades() {
    this.http.get(this.apiDiscapacidades).subscribe({
      next: (data: any) => {
        this.discapacidades = data;
      },
      error: () => {}
    });
  }

  cargarRutasGuardadas() {
    const user = this.authService.getUser();
    if (!user) return;

    this.http.get(`${this.apiRutas}/usuario/${user.id}`).subscribe({
      next: async (rutas: any) => {
        this.rutasGuardadas = [];
        for (const ruta of rutas) {
          try {
            const rutaDetalle: any = await this.http.get(`${this.apiRutas}/${ruta.id_ruta}`).toPromise();
            this.rutasGuardadas.push(rutaDetalle);
          } catch {}
        }
      },
      error: () => {}
    });
  }

  cargarResenasUsuario() {
    const user = this.authService.getUser();
    if (!user) return;

    this.http.get(`${this.apiResenas}/usuario/${user.id}`).subscribe({
      next: (data: any) => {
        this.resenasUsuario = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.resenasUsuario = [];
      }
    });
  }

  guardarCambios() {
    if (!this.usuario.correo || !this.usuario.celular) {
      this.mostrarToast('Completa todos los campos.', 'warning');
      return;
    }

    const user = this.authService.getUser();
    if (!user) return;

    const payload = {
      correo: this.usuario.correo,
      celular: this.usuario.celular,
      Discapacidades_id_discapacidad: this.usuario.Discapacidades_id_discapacidad
    };

    this.http.put(`${this.apiUsuarios}/${user.id}`, payload).subscribe({
      next: () => {
        this.mostrarToast('Perfil actualizado.', 'success');
      },
      error: () => {
        this.mostrarToast('Error al actualizar.', 'danger');
      }
    });
  }

  async eliminarResena(idResena: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Eliminar esta reseña?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.http.delete(`${this.apiResenas}/${idResena}`).subscribe({
              next: () => {
                this.mostrarToast('Reseña eliminada', 'success');
                this.cargarResenasUsuario();
              },
              error: () => {
                this.mostrarToast('Error al eliminar', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  calcularDistanciaTotal(): string {
    const total = this.rutasGuardadas.reduce((sum, ruta) => sum + (ruta.longitud_ruta || 0), 0);
    return total.toFixed(2);
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}