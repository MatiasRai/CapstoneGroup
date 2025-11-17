import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-info-servicio',
  templateUrl: './info-servicio.page.html',
  styleUrls: ['./info-servicio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ...IONIC_IMPORTS]
})
export class InfoServicioPage implements OnInit {
  servicio: any = null;
  empresa: any = null;
  cargando: boolean = true;
  currentUser: any = null;

  nuevaResena = {
    valoracion: 0,
    comentarios: '',
    hoverRating: 0
  };

  private host = window.location.hostname;
  private apiUrl = `http://${this.host}:3000/api/v1`;

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['servicio']) {
      this.servicio = navigation.extras.state['servicio'];
      console.log('🧩 Servicio recibido:', this.servicio);
    }
  }

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      console.log('👤 Usuario completo:', this.currentUser);
      console.log('👤 Propiedades:', Object.keys(this.currentUser));
    }

    if (!this.servicio) {
      console.error('No se recibió el servicio');
      this.router.navigate(['/menu']);
      return;
    }

    this.http.get(`${this.apiUrl}/empresas`).subscribe({
      next: (empresas: any) => {
        const empresasArray = Array.isArray(empresas) ? empresas : [empresas];
        this.empresa = empresasArray.find(
          (e: any) => e.id_empresa === this.servicio.Empresas_id_empresa
        );
        console.log('Empresa cargada:', this.empresa);
      },
      error: (err) => {
        console.error('Error al cargar empresa:', err);
      }
    });

    this.recargarServicio();
  }

  recargarServicio() {
    this.http.get(`${this.apiUrl}/servicios/todos/disponibles`).subscribe({
      next: (servicios: any) => {
        const serviciosArray = Array.isArray(servicios) ? servicios : [servicios];
        const servicioActualizado = serviciosArray.find(
          (s: any) => s.id_servicio === this.servicio.id_servicio
        );
        
        if (servicioActualizado) {
          this.servicio = servicioActualizado;
          console.log('Servicio actualizado:', this.servicio);
        }
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al recargar servicio:', err);
        this.cargando = false;
      }
    });
  }

  setRating(rating: number) {
    this.nuevaResena.valoracion = rating;
    console.log('Valoración seleccionada:', rating);
  }

  setHoverRating(rating: number) {
    this.nuevaResena.hoverRating = rating;
  }

  clearHoverRating() {
    this.nuevaResena.hoverRating = 0;
  }

  getStarIcon(position: number): string {
    const rating = this.nuevaResena.hoverRating || this.nuevaResena.valoracion;
    
    if (rating >= position) {
      return 'star';
    } else if (rating >= position - 0.5) {
      return 'star-half';
    } else {
      return 'star-outline';
    }
  }

  getStarColor(position: number): string {
    const rating = this.nuevaResena.hoverRating || this.nuevaResena.valoracion;
    return rating >= position - 0.5 ? '#FF9800' : '#BDBDBD';
  }

  async enviarResena() {
    if (this.nuevaResena.valoracion === 0) {
      const toast = await this.toastController.create({
        message: '⚠️ Por favor, selecciona una valoración',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    const lugarId = this.servicio.Lugares_id_lugar || this.servicio.id_lugar;
    const usuarioId = this.currentUser?.id_usuario || this.currentUser?.id;

    console.log('🔍 DEBUG - Lugar ID:', lugarId);
    console.log('🔍 DEBUG - Usuario ID:', usuarioId);
    console.log('🔍 DEBUG - Current User:', this.currentUser);
    console.log('🔍 DEBUG - Servicio:', this.servicio);

    if (!lugarId) {
      const toast = await this.toastController.create({
        message: '❌ Error: No se pudo identificar el lugar del servicio',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      console.error('Propiedades del servicio:', Object.keys(this.servicio));
      console.error('Servicio completo:', this.servicio);
      return;
    }

    if (!usuarioId) {
      const toast = await this.toastController.create({
        message: '❌ Error: Debes iniciar sesión para dejar una reseña',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      console.error('Propiedades del usuario:', this.currentUser ? Object.keys(this.currentUser) : 'null');
      console.error('Usuario completo:', this.currentUser);
      return;
    }

    const resenaData: any = {
      valoracion: this.nuevaResena.valoracion,
      comentarios: this.nuevaResena.comentarios.trim() || '',
      Lugares_id_lugar: lugarId,
      id_usuario: usuarioId
    };

    console.log('Enviando reseña:', resenaData);

    this.http.post(`${this.apiUrl}/resenas`, resenaData).subscribe({
      next: async (response) => {
        console.log('Reseña creada:', response);
        
        const toast = await this.toastController.create({
          message: '✅ ¡Gracias por tu reseña!',
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();

        this.nuevaResena = {
          valoracion: 0,
          comentarios: '',
          hoverRating: 0
        };

        this.recargarServicio();
      },
      error: async (err) => {
        console.error('Error al crear reseña:', err);
        const toast = await this.toastController.create({
          message: '❌ Error al enviar la reseña. Intenta de nuevo.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  calcularPromedioValoracion(resenas: any[]): string {
    if (!resenas || resenas.length === 0) return '0.0';
    
    const suma = resenas.reduce((acc, r) => acc + parseFloat(r.valoracion), 0);
    const promedio = suma / resenas.length;
    return promedio.toFixed(1);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }

  volverAlMenu() {
    this.router.navigate(['/menu']);
  }

  async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
}