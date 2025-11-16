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
  }

  /* ======================================================
     📋 CARGAR DATOS DEL USUARIO
  ====================================================== */
  cargarPerfil() {
    const user = this.authService.getUser();
    if (!user) {
      this.mostrarToast('⚠️ No se encontró usuario logueado', 'warning');
      return;
    }

    this.cargando = true;
    this.http.get(`${this.apiUsuarios}/${user.id}`).subscribe({
      next: (data: any) => {
        this.usuario = data;
        this.cargando = false;
        console.log('✅ Perfil cargado:', this.usuario);
      },
      error: (err) => {
        console.error('❌ Error al obtener perfil:', err);
        this.mostrarToast('❌ Error al cargar perfil', 'danger');
        this.cargando = false;
      }
    });
  }

  /* ======================================================
     🔹 CARGAR DISCAPACIDADES
  ====================================================== */
  cargarDiscapacidades() {
    this.http.get(this.apiDiscapacidades).subscribe({
      next: (data: any) => {
        this.discapacidades = data;
        console.log('✅ Discapacidades cargadas:', this.discapacidades.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar discapacidades:', err);
      }
    });
  }

  /* ======================================================
     🗺️ CARGAR RUTAS GUARDADAS (para estadísticas)
  ====================================================== */
  cargarRutasGuardadas() {
    const user = this.authService.getUser();
    if (!user) return;

    this.http.get(`${this.apiRutas}/usuario/${user.id}`).subscribe({
      next: async (rutas: any) => {
        this.rutasGuardadas = [];
        
        // Cargar detalles de cada ruta
        for (const ruta of rutas) {
          try {
            const rutaDetalle: any = await this.http.get(`${this.apiRutas}/${ruta.id_ruta}`).toPromise();
            this.rutasGuardadas.push(rutaDetalle);
          } catch (err) {
            console.error('Error cargando ruta:', err);
          }
        }
        
        console.log('✅ Rutas cargadas:', this.rutasGuardadas.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar rutas:', err);
      }
    });
  }

  /* ======================================================
     ⭐ CARGAR RESEÑAS DEL USUARIO
  ====================================================== */
  cargarResenasUsuario() {
    const user = this.authService.getUser();
    if (!user) return;

    this.http.get(`${this.apiResenas}/usuario/${user.id}`).subscribe({
      next: (data: any) => {
        this.resenasUsuario = Array.isArray(data) ? data : [];
        console.log('✅ Reseñas cargadas:', this.resenasUsuario.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar reseñas:', err);
        this.resenasUsuario = [];
      }
    });
  }

  /* ======================================================
     💾 GUARDAR CAMBIOS DEL PERFIL
  ====================================================== */
  guardarCambios() {
    if (!this.usuario.correo || !this.usuario.celular) {
      this.mostrarToast('⚠️ Por favor completa todos los campos.', 'warning');
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
        this.mostrarToast('✅ Perfil actualizado correctamente.', 'success');
      },
      error: (err) => {
        console.error('❌ Error al actualizar perfil:', err);
        this.mostrarToast('❌ Error al actualizar perfil.', 'danger');
      }
    });
  }

  /* ======================================================
     🗑️ ELIMINAR RESEÑA
  ====================================================== */
  async eliminarResena(idResena: number) {
    const alert = await this.alertCtrl.create({
      header: '⚠️ Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta reseña?<br><br>Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.http.delete(`${this.apiResenas}/${idResena}`).subscribe({
              next: () => {
                this.mostrarToast('✅ Reseña eliminada correctamente', 'success');
                this.cargarResenasUsuario(); // Recargar lista
              },
              error: (err) => {
                console.error('❌ Error al eliminar reseña:', err);
                this.mostrarToast('❌ Error al eliminar reseña', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  /* ======================================================
     📊 CALCULAR DISTANCIA TOTAL DE RUTAS
  ====================================================== */
  calcularDistanciaTotal(): string {
    const total = this.rutasGuardadas.reduce((sum, ruta) => sum + (ruta.longitud_ruta || 0), 0);
    return total.toFixed(2);
  }

  /* ======================================================
     🔔 MOSTRAR TOAST
  ====================================================== */
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