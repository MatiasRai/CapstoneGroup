import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class RutaDetallePage implements OnInit, OnDestroy {

  ruta: any = null;
  cargando: boolean = true;
  private map: L.Map | null = null;
  private routePolyline: L.Polyline | null = null;
  private mapInitialized = false;
  private readonly mapId = 'map-detalle';
  private timeouts: any[] = [];

  private host = window.location.hostname;
  private apiUrl = `http://${this.host}:3000/api/v1/rutas`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toast: ToastController
  ) {}

  ngOnInit() {
    this.fixLeafletIcons();
    
    const idRuta = Number(this.route.snapshot.paramMap.get('id'));

    if (!idRuta) {
      this.mostrarToast("Ruta no válida", "danger");
      this.volver();
      return;
    }

    this.cargarRuta(idRuta);
  }

  ionViewDidEnter() {
    if (this.ruta?.coordenadas?.length > 0 && !this.mapInitialized) {
      const timeout = setTimeout(() => {
        this.initMap();
      }, 100);
      this.timeouts.push(timeout);
    }
  }

  ionViewWillLeave() {
    this.clearTimeouts();
  }

  ngOnDestroy() {
    this.clearTimeouts();
    this.destroyMap();
  }

  private clearTimeouts() {
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
  }

  private destroyMap() {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
      this.mapInitialized = false;
      this.routePolyline = null;
    }

    const container = document.getElementById(this.mapId);
    if (container) {
      (container as any)._leaflet_id = null;
    }
  }

  private fixLeafletIcons() {
    const DefaultIcon = L.icon({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    L.Marker.prototype.options.icon = DefaultIcon;
  }

  cargarRuta(idRuta: number) {
    this.cargando = true;

    this.http.get(`${this.apiUrl}/${idRuta}`).subscribe({
      next: (data: any) => {
        this.ruta = data;
        this.cargando = false;

        if (!this.mapInitialized && this.ruta.coordenadas?.length > 0) {
          const timeout = setTimeout(() => {
            this.initMap();
          }, 200);
          this.timeouts.push(timeout);
        }
      },
      error: () => {
        this.cargando = false;
        this.ruta = null;
        this.mostrarToast("No se pudo cargar la ruta", "danger");
      }
    });
  }

  private initMap() {
    const container = document.getElementById(this.mapId);
    
    if (!container) {
      console.error('❌ Contenedor del mapa no encontrado');
      return;
    }

    if (this.map) {
      this.destroyMap();
    }

    const coords = this.ruta.coordenadas;

    if (!coords || coords.length === 0) {
      console.error('❌ No hay coordenadas disponibles');
      return;
    }

    const inicio: [number, number] = [
      coords[0].latitud,
      coords[0].longitud,
    ];

    try {
      this.map = L.map(this.mapId, {
        center: inicio,
        zoom: 14,
        zoomControl: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(this.map);

      this.mapInitialized = true;

      const timeout = setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          this.mostrarRutaEnMapa();
        }
      }, 100);
      this.timeouts.push(timeout);
    } catch (error) {
      console.error('❌ Error al inicializar mapa:', error);
      this.mapInitialized = false;
    }
  }

  private mostrarRutaEnMapa() {
    if (!this.map || !this.ruta?.coordenadas?.length) return;

    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }

    const coords = this.ruta.coordenadas.map((c: any) => [
      c.latitud,
      c.longitud,
    ]) as [number, number][];

    this.routePolyline = L.polyline(coords, {
      color: "#007BFF",
      weight: 5,
      opacity: 0.9
    }).addTo(this.map);

    // Marcador de inicio con ícono de persona (verde)
    const startIcon = this.createStartIcon();
    L.marker(coords[0], { icon: startIcon })
      .addTo(this.map)
      .bindPopup("<b>Inicio</b>")
      .openPopup();

    // Marcador de fin con bandera roja
    const endIcon = this.createEndIcon();
    L.marker(coords[coords.length - 1], { icon: endIcon })
      .addTo(this.map)
      .bindPopup("<b>Fin</b>");

    const bounds = L.latLngBounds(coords);
    this.map.fitBounds(bounds, { padding: [20, 20] });
  }

  volver() {
    this.router.navigate(['/rutas-recomendadas']);
  }

  verEnMapa() {
    this.router.navigate(['/menu'], {
      state: { rutaId: this.ruta.id_ruta }
    });
  }

  async compartirRuta() {
    const url = `${window.location.origin}/ruta-detalle/${this.ruta.id_ruta}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: this.ruta.nombre_ruta,
          text: "Revisa esta ruta accesible:",
          url
        });
        this.mostrarToast("Ruta compartida", "success");
      } catch (error) {
        console.log(error);
      }
    } else {
      await navigator.clipboard.writeText(url);
      this.mostrarToast("Enlace copiado", "primary");
    }
  }

  async mostrarToast(msg: string, color: string) {
    const t = await this.toast.create({
      message: msg,
      color,
      duration: 1800
    });
    t.present();
  }

  // ───────────────── ICONOS PERSONALIZADOS ─────────────────
  private createStartIcon(): L.DivIcon {
    return L.divIcon({
      className: 'user-location-icon',
      html: `
        <div style="position: relative;">
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <!-- Círculo exterior (borde blanco) -->
            <circle cx="20" cy="20" r="18" fill="#fff" stroke="#4CAF50" stroke-width="2"/>
            <!-- Círculo interior verde -->
            <circle cx="20" cy="20" r="15" fill="#4CAF50"/>
            <!-- Icono de persona -->
            <g fill="#fff">
              <!-- Cabeza -->
              <circle cx="20" cy="15" r="4"/>
              <!-- Cuerpo -->
              <path d="M 20 19 Q 15 19 13 25 L 13 28 L 27 28 L 27 25 Q 25 19 20 19 Z"/>
            </g>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  private createEndIcon(): L.DivIcon {
    return L.divIcon({
      className: 'end-flag-icon',
      html: `
        <div style="position: relative;">
          <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <!-- Poste de la bandera -->
            <rect x="18" y="5" width="4" height="45" fill="#333"/>
            <!-- Base del poste -->
            <ellipse cx="20" cy="48" rx="8" ry="3" fill="#333" opacity="0.5"/>
            <!-- Bandera roja -->
            <path d="M 22 8 L 38 15 L 22 22 Z" fill="#F44336" stroke="#C62828" stroke-width="1"/>
            <!-- Brillo en la bandera -->
            <path d="M 22 8 L 30 12 L 22 16 Z" fill="#FF5252" opacity="0.6"/>
          </svg>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
    });
  }
}