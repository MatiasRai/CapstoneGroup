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
  rutasPaginadas: any[] = [];
  searchTerm: string = '';
  cargando: boolean = true;

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Exponer Math para usar en el template
  Math = Math;

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

  
  cargarRutas() {
    this.cargando = true;
    
    this.http.get(this.apiUrl).subscribe({
      next: async (rutas: any) => {
        this.todasLasRutas = [];
        
        
        for (const ruta of rutas) {
          try {
            const rutaDetalle: any = await this.http.get(`${this.apiUrl}/${ruta.id_ruta}`).toPromise();
            this.todasLasRutas.push(rutaDetalle);
          } catch (err) {
            console.error('Error cargando ruta:', err);
          }
        }
        
        this.rutasFiltradas = [...this.todasLasRutas];
        this.calcularPaginacion();
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

  
  filtrarRutas() {
    const termino = this.searchTerm.toLowerCase().trim();
    
    if (!termino) {
      this.rutasFiltradas = [...this.todasLasRutas];
    } else {
      this.rutasFiltradas = this.todasLasRutas.filter(ruta => 
        ruta.nombre_ruta?.toLowerCase().includes(termino) ||
        ruta.descripcion_ruta?.toLowerCase().includes(termino) ||
        ruta.usuario_nombre?.toLowerCase().includes(termino)
      );
    }
    
    // Resetear a la primera página después de filtrar
    this.currentPage = 1;
    this.calcularPaginacion();
  }

  // ───────────────── PAGINACIÓN ─────────────────
  calcularPaginacion() {
    this.totalPages = Math.ceil(this.rutasFiltradas.length / this.itemsPerPage);
    this.actualizarRutasPaginadas();
  }

  actualizarRutasPaginadas() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.rutasPaginadas = this.rutasFiltradas.slice(startIndex, endIndex);
  }

  irAPaginaAnterior() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.actualizarRutasPaginadas();
      this.scrollToTop();
    }
  }

  irAPaginaSiguiente() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.actualizarRutasPaginadas();
      this.scrollToTop();
    }
  }

  irAPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.actualizarRutasPaginadas();
      this.scrollToTop();
    }
  }

  getPaginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxPaginasVisibles = 5;
    
    let inicio = Math.max(1, this.currentPage - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(this.totalPages, inicio + maxPaginasVisibles - 1);
    
    if (fin - inicio < maxPaginasVisibles - 1) {
      inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  scrollToTop() {
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(400);
    }
  }

  
  verDetalle(idRuta: number) {
    this.router.navigate(['/ruta-detalle', idRuta]);
  }

  
  calcularDistanciaTotal(): string {
    const total = this.todasLasRutas.reduce((sum, ruta) => 
      sum + (parseFloat(ruta.longitud_ruta) || 0), 0
    );
    return total.toFixed(2);
  }

  
  contarUsuarios(): number {
    const usuarios = new Set(this.todasLasRutas.map(r => r.id_usuario));
    return usuarios.size;
  }

  
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