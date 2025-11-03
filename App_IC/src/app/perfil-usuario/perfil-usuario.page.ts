import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

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
  cargando = false;

  private baseHost = window.location.hostname;
  private apiUsuarios = `http://${this.baseHost}:3000/api/v1/usuarios`;
  private apiDiscapacidades = `http://${this.baseHost}:3000/api/v1/discapacidades`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargarPerfil();
    this.cargarDiscapacidades();
  }

  // 🔹 Cargar datos del usuario actual
  cargarPerfil() {
    const user = this.authService.getUser();
    if (!user) return;

    this.cargando = true;
    this.http.get(`${this.apiUsuarios}/${user.id}`).subscribe({
      next: (data: any) => {
        this.usuario = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al obtener perfil:', err);
        this.cargando = false;
      }
    });
  }

  // 🔹 Obtener lista de discapacidades
  cargarDiscapacidades() {
    this.http.get(this.apiDiscapacidades).subscribe({
      next: (data: any) => this.discapacidades = data,
      error: (err) => console.error('Error al cargar discapacidades:', err)
    });
  }

  // 🔹 Guardar cambios del perfil
  guardarCambios() {
    if (!this.usuario.correo || !this.usuario.celular) {
      this.mostrarToast('Por favor completa todos los campos.', 'warning');
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
        console.error('Error al actualizar perfil:', err);
        this.mostrarToast('❌ Error al actualizar perfil.', 'danger');
      }
    });
  }

  // 🔹 Mostrar mensaje
  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
