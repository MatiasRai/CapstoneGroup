import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { ToastController } from '@ionic/angular';
import * as L from 'leaflet';

@Component({
  selector: 'app-ruta-detalle',
  templateUrl: './ruta-detalle.page.html',
  styleUrls: ['./ruta-detalle.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ...IONIC_IMPORTS]
})
export class RutaDetallePage implements OnInit, AfterViewInit, OnDestroy {
  
  ruta: any = null;
  cargando: boolean = true;
  mostrarCoordenadas: boolean = false;
  
  private map!: L.Map;
  private routePolyline: L.Polyline | null = null;
  private host = window.location.hostname;
  private apiUrl = `http://${this.host}:3000/api/v1/rutas`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const idRuta = this.route.snapshot.paramMap.get('id');
    if (idRuta) {
      this.cargarRuta(parseInt(idRuta));
    } else {
      this.mostrarToast('ID de ruta inválido', 'danger');
      this.volver();
    }
  }

  ngAfterViewInit() {
    this.fixLeafletIcons();
    setTimeout(() => {
      if (this.ruta && this.ruta.coordenadas && this.ruta.coordenadas.length > 0) {
        this.initMap();
      }
    }, 500);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  /* ======================================================
     📍 CARGAR RUTA
  ====================================================== */
  cargarRuta(idRuta: number) {
    this.cargando = true;
    
    this.http.get(`${this.apiUrl}/${idRuta}`).subscribe({
      next: (data: any) => {
        this.ruta = data;
        this.cargando = false;
        console.log('✅ Ruta cargada:', this.ruta);
        
        // Si el mapa ya está inicializado, actualizar
        if (this.map && this.ruta.coordenadas && this.ruta.coordenadas.length > 0) {
          this.mostrarRutaEnMapa();
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar ruta:', err);
        this.cargando = false;
        this.ruta = null;
        this.mostrarToast('Error al cargar la ruta', 'danger');
      }
    });
  }

  /* ======================================================
     🗺️ INICIALIZAR MAPA
  ====================================================== */
  private fixLeafletIcons(): void {
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  private initMap(): void {
    if (!this.ruta || !this.ruta.coordenadas || this.ruta.coordenadas.length === 0) {
      console.warn('⚠️ No hay coordenadas para mostrar');
      return;
    }

    const primeraCoord = this.ruta.coordenadas[0];
    const initialLocation: [number, number] = [primeraCoord.latitud, primeraCoord.longitud];

    this.map = L.map('map', {
      center: initialLocation,
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      minZoom: 10
    }).addTo(this.map);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.mostrarRutaEnMapa();
      }
    }, 200);
  }

  /* ======================================================
     🛣️ MOSTRAR RUTA EN EL MAPA
  ====================================================== */
  private mostrarRutaEnMapa(): void {
    if (!this.map || !this.ruta || !this.ruta.coordenadas || this.ruta.coordenadas.length === 0) {
      return;
    }

    // Limpiar polyline anterior
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }

    const coords = this.ruta.coordenadas.map((c: any) => 
      [c.latitud, c.longitud] as [number, number]
    );

    // Crear polyline de la ruta
    this.routePolyline = L.polyline(coords, {
      color: '#667eea',
      weight: 5,
      opacity: 0.8,
      smoothFactor: 1.0,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.map);

    // Íconos personalizados
    const greenIcon = this.createColoredIcon('green');
    const redIcon = this.createColoredIcon('red');

    // Marcador de inicio
    L.marker(coords[0], { icon: greenIcon })
      .addTo(this.map)
      .bindPopup(`
        <b>🚩 Inicio: ${this.ruta.nombre_ruta}</b><br>
        ${this.ruta.descripcion_ruta || ''}<br>
        <small>📏 Distancia total: ${this.ruta.longitud_ruta} km</small><br>
        <small>📍 ${coords.length} puntos GPS</small>
      `)
      .openPopup();

    // Marcador de fin
    L.marker(coords[coords.length - 1], { icon: redIcon })
      .addTo(this.map)
      .bindPopup(`<b>🏁 Fin: ${this.ruta.nombre_ruta}</b>`);

    // Ajustar vista al recorrido
    const bounds = L.latLngBounds(coords);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }

  private createColoredIcon(color: string): L.Icon {
    return L.icon({
      iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  /* ======================================================
     🔙 VOLVER
  ====================================================== */
  volver() {
    this.router.navigate(['/rutas-recomendadas']);
  }

  /* ======================================================
     🗺️ VER EN MAPA PRINCIPAL
  ====================================================== */
  verEnMapa() {
    this.router.navigate(['/menu'], {
      state: { rutaId: this.ruta.id_ruta }
    });
  }

  /* ======================================================
     📤 COMPARTIR RUTA
  ====================================================== */
  async compartirRuta() {
    const url = `${window.location.origin}/ruta-detalle/${this.ruta.id_ruta}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: this.ruta.nombre_ruta,
          text: `Descubre esta ruta: ${this.ruta.nombre_ruta} - ${this.ruta.longitud_ruta} km`,
          url: url
        });
        this.mostrarToast('✅ Ruta compartida', 'success');
      } catch (err) {
        console.log('Error al compartir:', err);
      }
    } else {
      // Copiar al portapapeles
      navigator.clipboard.writeText(url).then(() => {
        this.mostrarToast('📋 Enlace copiado al portapapeles', 'success');
      });
    }
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