import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IONIC_IMPORTS],
})
export class MenuPage implements OnInit, AfterViewInit {
  form!: FormGroup;
  private map!: L.Map;
  private polyline!: L.Polyline;
  private rutasDibujadas: L.Polyline[] = [];
  private markers: L.Marker[] = [];

  coordenadas: { lat: number; lng: number }[] = [];
  rutas: any[] = [];

  filtros = {
    tipo_ruta: '',
    max_longitud: '',
    id_discapacidad: ''
  };

  tiposRuta: any[] = [];
  discapacidades: any[] = [];

  // 🔗 Endpoints backend
  private apiUrl = 'http://localhost:3000/api/v1/rutas';
  private tiposUrl = 'http://localhost:3000/api/v1/tipos_ruta';
  private discUrl = 'http://localhost:3000/api/v1/discapacidades';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nombre_ruta: [''],
      descripcion_ruta: ['']
    });

    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.filtros.id_discapacidad = user.Discapacidades_id_discapacidad || '';

    // 🔽 Cargar datos iniciales
    await Promise.all([this.obtenerTiposRuta(), this.obtenerDiscapacidades()]);
    await this.obtenerRutas();
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    this.initMap();
  }

  // 🧩 Corrige íconos de Leaflet (Ionic rompe las rutas por defecto)
  private fixLeafletIcons(): void {
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  // 🗺️ Inicializa mapa interactivo
  private initMap(): void {
    // Crear mapa
    this.map = L.map('map', {
      center: [-41.4689, -72.9411],
      zoom: 13,
      zoomControl: true
    });

    // Capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Capa para la línea azul
    this.polyline = L.polyline([], { color: 'blue', weight: 4 }).addTo(this.map);

    // ⚙️ Soluciona errores de tamaño en Ionic
    setTimeout(() => this.map.invalidateSize(), 500);

    // Evento de clic → agregar marcador y punto a la línea
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const punto = { lat: e.latlng.lat, lng: e.latlng.lng };
      console.log('📍 Punto agregado:', punto);

      this.coordenadas.push(punto);
      this.polyline.addLatLng(e.latlng);

      // 🔹 Mostrar marcador visual
      const marker = L.marker(e.latlng)
        .addTo(this.map)
        .bindPopup(`Punto ${this.coordenadas.length}`)
        .openPopup();
      this.markers.push(marker);

      // 🔹 Centrar vista si hay más de 1 punto
      if (this.coordenadas.length > 1) {
        this.map.fitBounds(this.polyline.getBounds(), { padding: [20, 20] });
      }

      // 🔹 Forzar redibujado
      this.map.invalidateSize();
    });
  }

  // 🧹 Limpiar mapa (marcadores + línea)
  limpiarMapa(): void {
    this.coordenadas = [];
    this.polyline.setLatLngs([]);
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
  }

  // 📝 Registrar nueva ruta
  registrarRuta(): void {
    if (this.coordenadas.length === 0) {
      this.mostrarAlerta('Aviso', 'Primero selecciona puntos en el mapa.');
      return;
    }

    const data = {
      ...this.form.value,
      id_tipo_ruta: this.filtros.tipo_ruta || 1,
      id_usuario: 2,
      coordenadas: this.coordenadas
    };

    this.http.post(`${this.apiUrl}`, data).subscribe({
      next: async () => {
        const alert = await this.alertCtrl.create({
          header: 'Éxito',
          message: 'Ruta registrada correctamente ✅',
          buttons: ['OK']
        });
        await alert.present();

        this.form.reset();
        this.limpiarMapa();
        this.obtenerRutas();
      },
      error: async (err) => {
        console.error('❌ Error al registrar ruta', err);
        this.mostrarAlerta('Error', 'No se pudo registrar la ruta.');
      }
    });
  }

  // 🔍 Obtener rutas filtradas
  async obtenerRutas() {
    const loading = await this.loadingCtrl.create({ message: 'Cargando rutas...' });
    await loading.present();

    try {
      const params: any = {};
      if (this.filtros.tipo_ruta) params.tipo_ruta = this.filtros.tipo_ruta;
      if (this.filtros.max_longitud) params.max_longitud = this.filtros.max_longitud;
      if (this.filtros.id_discapacidad) params.id_discapacidad = this.filtros.id_discapacidad;

      this.http.get<any[]>(`${this.apiUrl}/filtrar`, { params }).subscribe({
        next: async (data) => {
          await loading.dismiss();
          this.rutas = Array.isArray(data) ? data : [];
          this.mostrarRutasEnMapa();
        },
        error: async (err) => {
          console.error('❌ Error al obtener rutas:', err);
          await loading.dismiss();
          this.mostrarAlerta('Error', 'No se pudieron cargar las rutas.');
        }
      });
    } catch (error) {
      console.error('❌ Error general:', error);
      await loading.dismiss();
    }
  }

  // 📋 Cargar tipos de ruta
  async obtenerTiposRuta() {
    try {
      const data = await this.http.get<any[]>(this.tiposUrl).toPromise();
      this.tiposRuta = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al cargar tipos de ruta', error);
    }
  }

  // ♿ Cargar discapacidades
  async obtenerDiscapacidades() {
    try {
      const data = await this.http.get<any[]>(this.discUrl).toPromise();
      this.discapacidades = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al cargar discapacidades', error);
    }
  }

  // 🗺️ Mostrar rutas en el mapa
  private mostrarRutasEnMapa() {
    if (!this.map) return;
    this.rutasDibujadas.forEach(r => this.map.removeLayer(r));
    this.rutasDibujadas = [];

    if (!Array.isArray(this.rutas) || this.rutas.length === 0) return;

    this.rutas.forEach(ruta => {
      if (ruta.coordenadas?.length) {
        const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud]);
        const poly = L.polyline(coords, { color: 'green', weight: 4 }).addTo(this.map);
        poly.bindPopup(`<b>${ruta.nombre_ruta}</b><br>${ruta.descripcion_ruta || ''}`);
        this.rutasDibujadas.push(poly);
      }
    });
  }

  // 🧭 Ver una ruta específica
  verRutaEnMapa(ruta: any) {
    if (!ruta.coordenadas?.length) return;
    const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud]);
    this.rutasDibujadas.forEach(r => this.map.removeLayer(r));
    this.rutasDibujadas = [];

    const poly = L.polyline(coords, { color: 'orange', weight: 5 }).addTo(this.map);
    this.map.fitBounds(poly.getBounds());
    poly.bindPopup(`<b>${ruta.nombre_ruta}</b><br>${ruta.descripcion_ruta || ''}`).openPopup();
    this.rutasDibujadas.push(poly);
  }

  // 🔘 Aplicar filtros
  async aplicarFiltros() {
    await this.obtenerRutas();
  }

  // ⚠️ Alertas genéricas
  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
}
