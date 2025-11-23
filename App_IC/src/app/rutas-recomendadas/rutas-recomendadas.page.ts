import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-rutas-recomendadas',
  templateUrl: './rutas-recomendadas.page.html',
  styleUrls: ['./rutas-recomendadas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ...IONIC_IMPORTS]
})
export class RutasRecomendadasPage implements OnInit {
  
  todasLasRutas: any[] = [];
  rutasFiltradas: any[] = [];
  searchTerm: string = '';
  cargando: boolean = true;

  private host = window.location.hostname;
  private apiUrl = `http://${this.host}:3000/api/v1/rutas`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarRutas();
  }

  /* ======================================================
     📍 CARGAR TODAS LAS RUTAS
  ====================================================== */
  cargarRutas() {
    this.cargando = true;
    
    this.http.get(this.apiUrl).subscribe({
      next: async (rutas: any) => {
        this.todasLasRutas = [];
        
        // Cargar detalles de cada ruta
        for (const ruta of rutas) {
          try {
            const rutaDetalle: any = await this.http.get(`${this.apiUrl}/${ruta.id_ruta}`).toPromise();
            this.todasLasRutas.push(rutaDetalle);
          } catch (err) {
            console.error('Error cargando ruta:', err);
          }
        }
        
        this.rutasFiltradas = [...this.todasLasRutas];
        this.cargando = false;
        console.log('✅ Rutas cargadas:', this.todasLasRutas.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar rutas:', err);
        this.cargando = false;
        this.mostrarToast('Error al cargar rutas', 'danger');
      }
    });
  }

  /* ======================================================
     🔍 FILTRAR RUTAS POR BÚSQUEDA
  ====================================================== */
  filtrarRutas() {
    const termino = this.searchTerm.toLowerCase().trim();
    
    if (!termino) {
      this.rutasFiltradas = [...this.todasLasRutas];
      return;
    }

    this.rutasFiltradas = this.todasLasRutas.filter(ruta => 
      ruta.nombre_ruta?.toLowerCase().includes(termino) ||
      ruta.descripcion_ruta?.toLowerCase().includes(termino) ||
      ruta.usuario_nombre?.toLowerCase().includes(termino)
    );
  }

  /* ======================================================
     👁️ VER DETALLE DE RUTA
  ====================================================== */
  verDetalle(idRuta: number) {
    this.router.navigate(['/ruta-detalle', idRuta]);
  }

  /* ======================================================
     📊 CALCULAR DISTANCIA TOTAL
  ====================================================== */
  calcularDistanciaTotal(): string {
    const total = this.todasLasRutas.reduce((sum, ruta) => 
      sum + (parseFloat(ruta.longitud_ruta) || 0), 0
    );
    return total.toFixed(2);
  }

  /* ======================================================
     👥 CONTAR USUARIOS ÚNICOS
  ====================================================== */
  contarUsuarios(): number {
    const usuarios = new Set(this.todasLasRutas.map(r => r.id_usuario));
    return usuarios.size;
  }

  /* ======================================================
     🔔 MOSTRAR TOAST
  ====================================================== */
  async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}