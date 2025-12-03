import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-blind',
  templateUrl: './menu-blind.page.html',
  styleUrls: ['./menu-blind.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ...IONIC_IMPORTS]
})
export class MenuBlindPage implements OnInit, OnDestroy {

  servicios: any[] = [];
  cargando: boolean = true;
  private synthesis: SpeechSynthesis;
  private lastTapTime: number = 0;
  private tapTimeout: any = null;
  private readonly DOUBLE_TAP_DELAY = 300; // milisegundos

  private host = window.location.hostname;
  private apiUrl = `http://${this.host}:3000/api/v1`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.synthesis = window.speechSynthesis;
  }

  ngOnInit() {
    this.cargarServicios();
    setTimeout(() => {
      this.darBienvenida();
    }, 500);
  }

  ngOnDestroy() {
    // Detener cualquier voz en reproducción
    this.synthesis.cancel();
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
    }
  }

  darBienvenida() {
    // Este método se llamará después de cargar los servicios
  }

  cargarServicios() {
    this.cargando = true;
    
    this.http.get(`${this.apiUrl}/servicios/todos/disponibles`).subscribe({
      next: (servicios: any) => {
        // Filtrar solo servicios con discapacidad visual
        this.servicios = servicios.filter((s: any) => 
          s.nombre_discapacidad && 
          s.nombre_discapacidad.toLowerCase().includes('visual') &&
          s.latitud && 
          s.longitud
        );
        
        this.cargando = false;
        
        if (this.servicios.length === 0) {
          this.hablar('Bienvenido al menú accesible para personas con discapacidad visual. No se encontraron servicios adaptados en este momento.');
        } else {
          const mensaje = `Bienvenido al menú accesible para personas con discapacidad visual. 
          Se encontraron ${this.servicios.length} servicios disponibles adaptados para ti. 
          Para escuchar el nombre y precio de un servicio, toca una vez sobre él. 
          Para escuchar información completa del servicio, toca dos veces rápidamente.
          Recomendación importante: Para tu seguridad, te sugerimos ir acompañado de una persona de confianza al visitar estos servicios.`;
          this.hablar(mensaje);
        }
        
        console.log('✅ Servicios cargados para discapacidad visual:', this.servicios.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar servicios:', err);
        this.cargando = false;
        this.hablar('Error al cargar los servicios. Por favor intenta más tarde.');
      }
    });
  }

  onServicioTap(servicio: any) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - this.lastTapTime;

    if (timeDiff < this.DOUBLE_TAP_DELAY && timeDiff > 0) {
      // Doble toque detectado
      if (this.tapTimeout) {
        clearTimeout(this.tapTimeout);
        this.tapTimeout = null;
      }
      this.darInformacionCompleta(servicio);
    } else {
      // Primer toque
      if (this.tapTimeout) {
        clearTimeout(this.tapTimeout);
      }
      
      this.tapTimeout = setTimeout(() => {
        this.darInformacionBasica(servicio);
        this.tapTimeout = null;
      }, this.DOUBLE_TAP_DELAY);
    }

    this.lastTapTime = currentTime;
  }

  darInformacionBasica(servicio: any) {
    this.synthesis.cancel(); // Cancelar cualquier voz anterior
    
    const mensaje = `${servicio.nombre_servicio}. Precio: ${this.formatearPrecio(servicio.costo_servicio)} pesos.`;
    this.hablar(mensaje);
  }

  darInformacionCompleta(servicio: any) {
    this.synthesis.cancel(); // Cancelar cualquier voz anterior
    
    let mensaje = `Información completa del servicio. 
    Nombre: ${servicio.nombre_servicio}. 
    Precio: ${this.formatearPrecio(servicio.costo_servicio)} pesos. 
    Empresa: ${servicio.nombre_empresa || 'No especificada'}. 
    Lugar: ${servicio.nombre_lugar || 'No especificado'}. 
    Dirección: ${servicio.direccion_lugar || 'No especificada'}. `;
    
    if (servicio.descripcion_servicio) {
      mensaje += `Descripción: ${servicio.descripcion_servicio}. `;
    }
    
    if (servicio.horario_disponible) {
      mensaje += `Horario: ${servicio.horario_disponible}. `;
    }
    
    if (servicio.resenas && servicio.resenas.length > 0) {
      const promedio = this.calcularPromedioValoracion(servicio.resenas);
      mensaje += `Valoración promedio: ${promedio} de 5 estrellas. `;
    }
    
    this.hablar(mensaje);
  }

  hablar(texto: string) {
    if (!this.synthesis) {
      console.error('SpeechSynthesis no está disponible');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Velocidad un poco más lenta para mejor comprensión
    utterance.pitch = 1;
    utterance.volume = 1;

    this.synthesis.speak(utterance);
  }

  formatearPrecio(precio: any): string {
    if (!precio) return 'no especificado';
    const num = parseFloat(precio);
    return isNaN(num) ? 'no especificado' : num.toLocaleString('es-CL');
  }

  calcularPromedioValoracion(resenas: any[]): string {
    if (!resenas || resenas.length === 0) return '0';
    const suma = resenas.reduce((acc, r) => acc + (r.valoracion || 0), 0);
    return (suma / resenas.length).toFixed(1);
  }

  detenerVoz() {
    this.synthesis.cancel();
  }

  volver() {
    this.synthesis.cancel();
    this.router.navigate(['/menu']);
  }

  recargarServicios() {
    this.hablar('Recargando servicios');
    this.cargarServicios();
  }
}
