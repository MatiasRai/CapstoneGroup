import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { Platform, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdmEmpresaService } from '../services/adm-empresa.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, IONIC_IMPORTS]
})
export class MenuPage implements OnInit, AfterViewInit, OnDestroy {
  // ───────────────── MAPA / ESTADO ─────────────────
  private map!: L.Map;
  private defaultIcon!: L.Icon;

  /** Íconos específicos para cada tipo de lugar */
  private servicioIcons: { [key: string]: L.Icon } = {};

  currentLocation: [number, number] | null = null;
  private currentUserId: number | null = null;
  private host = window.location.hostname;
  private apiUrl = `http://${this.host}:3000/api/v1`;

  isRecording: boolean = false;
  recordedPoints: { latitud: number; longitud: number; timestamp: number }[] = [];
  recordingPolyline: L.Polyline | null = null;
  startMarker: L.Marker | null = null;
  currentMarker: L.Marker | null = null;
  watchId: number | null = null;
  totalDistance: number = 0;
  startTime: number = 0;
  recordingInterval: any = null;

  currentSpeed: number = 0;
  elapsedTime: string = '00:00:00';

  rutasGuardadas: any[] = [];
  rutasPolylines: L.Polyline[] = [];
  rutasPublicas: any[] = [];

  // Servicios disponibles
  serviciosDisponibles: any[] = [];
  serviciosFiltrados: any[] = [];
  serviciosMarkers: L.Marker[] = [];
  servicioSeleccionado: any = null;

  // Filtro de discapacidades
  tiposDiscapacidad: any[] = [];
  discapacidadSeleccionada: number | null = null;

  private lastMapUpdate: number = 0;
  private mapUpdateThrottle: number = 1000;

  isUserLoggedIn: boolean = false;

  constructor(
    private platform: Platform,
    private http: HttpClient,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private router: Router,
    private admEmpresaService: AdmEmpresaService,
    private authService: AuthService
  ) {}

  // ───────────────── NAVEGACIÓN ─────────────────
  irARutasRecomendadas() {
    this.router.navigate(['/rutas-recomendadas']);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  // ───────────────── CICLO DE VIDA ─────────────────
  ngOnInit() {
    this.loadCurrentUser();
    this.initServiceIcons();        // ← inicializamos los íconos personalizados
    this.getCurrentPosition();
    this.cargarTiposDiscapacidad();
    this.cargarServiciosDisponibles();
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.stopRecording();
  }

  // ───────────────── USUARIO / SESIÓN ─────────────────
  private loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
      this.isUserLoggedIn = true;

      if (this.currentUserId) {
        this.cargarRutasGuardadas();
        this.cargarRutasPublicas();
      }
    } else {
      this.isUserLoggedIn = false;
      this.cargarRutasPublicas();
    }
  }

  // ───────────────── SERVICIOS EN MAPA ─────────────────
  cargarTiposDiscapacidad() {
    this.http.get(`${this.apiUrl}/discapacidades/tipos`).subscribe({
      next: (tipos: any) => {
        this.tiposDiscapacidad = tipos;
        console.log('♿ Tipos de discapacidad cargados:', this.tiposDiscapacidad.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar tipos de discapacidad:', err);
      }
    });
  }

  cargarServiciosDisponibles() {
    this.admEmpresaService.obtenerTodosLosServicios().subscribe({
      next: (servicios: any[]) => {
        this.serviciosDisponibles = servicios.filter(s => s.latitud && s.longitud);
        this.serviciosFiltrados = [...this.serviciosDisponibles];
        console.log('🧩 Servicios cargados:', this.serviciosDisponibles.length);
        if (this.map) {
          this.mostrarServiciosEnMapa();
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar servicios:', err);
      }
    });
  }

  filtrarPorDiscapacidad() {
    if (this.discapacidadSeleccionada === null) {
      // Mostrar todos los servicios
      this.serviciosFiltrados = [...this.serviciosDisponibles];
    } else {
      // Filtrar por tipo de discapacidad
      this.serviciosFiltrados = this.serviciosDisponibles.filter(
        s => s.id_discapacidad === this.discapacidadSeleccionada
      );
    }
    console.log('🔍 Servicios filtrados:', this.serviciosFiltrados.length);
    this.mostrarServiciosEnMapa();
  }

  limpiarFiltro() {
    this.discapacidadSeleccionada = null;
    this.serviciosFiltrados = [...this.serviciosDisponibles];
    this.mostrarServiciosEnMapa();
    this.showToast('✨ Filtro limpiado - Mostrando todos los servicios', 'success');
  }

  private mostrarServiciosEnMapa() {
    if (!this.map) return;

    // limpiar marcadores anteriores
    this.serviciosMarkers.forEach(m => this.map.removeLayer(m));
    this.serviciosMarkers = [];

    this.serviciosFiltrados.forEach(servicio => {
      if (servicio.latitud && servicio.longitud) {
        const icon = this.getIconForServicio(servicio);
        const marker = L.marker([servicio.latitud, servicio.longitud], { icon })
          .addTo(this.map);

        marker.on('click', () => {
          this.seleccionarServicio(servicio);
        });

        this.serviciosMarkers.push(marker);
      }
    });

    console.log(`✅ ${this.serviciosMarkers.length} servicios mostrados en el mapa`);
  }

  seleccionarServicio(servicio: any) {
    this.servicioSeleccionado = servicio;
    console.log('🧩 Servicio seleccionado:', servicio.nombre_servicio);

    if (servicio.latitud && servicio.longitud && this.map) {
      this.map.setView([servicio.latitud, servicio.longitud], 16, {
        animate: true,
        duration: 0.5
      });
    }

    setTimeout(() => {
      const serviciosSection = document.getElementById('servicios-section');
      if (serviciosSection) {
        serviciosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  limpiarSeleccionServicio() {
    this.servicioSeleccionado = null;
  }

  verMasInformacion() {
    if (!this.servicioSeleccionado) return;

    this.router.navigate(['/info-servicio'], {
      state: { servicio: this.servicioSeleccionado }
    });
  }

  calcularPromedioValoracion(resenas: any[]): string {
    if (!resenas || resenas.length === 0) return '0.0';
    const suma = resenas.reduce((acc, r) => acc + (r.valoracion || 0), 0);
    return (suma / resenas.length).toFixed(1);
  }

  // ───────────────── GEOLOCALIZACIÓN ─────────────────
  async getCurrentPosition() {
    try {
      if (!navigator.geolocation) {
        await this.showToast('⚠️ Tu navegador no soporta geolocalización', 'danger');
        this.usarUbicacionPorDefecto();
        return;
      }

      const isSecure = window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        await this.showAlertHTTPS();
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = [position.coords.latitude, position.coords.longitude];

          if (this.map) {
            this.map.setView(this.currentLocation, 15);
            this.addCurrentLocationMarker();
          }

          this.showToast('✅ GPS conectado correctamente', 'success');
        },
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );

    } catch (error: any) {
      await this.showToast(`⚠️ Error GPS: ${error.message}`, 'warning');
      this.usarUbicacionPorDefecto();
    }
  }

  private handleLocationError(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.showToast('⚠️ Permiso de ubicación denegado', 'warning');
        this.showAlertPermisosDenegados();
        break;
      case error.POSITION_UNAVAILABLE:
        this.showToast('⚠️ Ubicación no disponible', 'warning');
        break;
      case error.TIMEOUT:
        this.showToast('⚠️ Tiempo de espera agotado. Intenta de nuevo.', 'warning');
        break;
    }
    this.usarUbicacionPorDefecto();
  }

  async showAlertHTTPS() {
    const alert = await this.alertController.create({
      header: '🔐 Conexión No Segura',
      message: 'Estás usando HTTP. La geolocalización puede no funcionar correctamente.',
      buttons: ['Entendido']
    });
    await alert.present();
  }

  async showAlertPermisosDenegados() {
    const alert = await this.alertController.create({
      header: '⚠️ Permiso Denegado',
      message: `
        Necesitamos acceso a tu ubicación para grabar rutas.<br><br>
        <b>Para activarlo:</b><br>
        1. Click en el 🔒 en la barra de direcciones<br>
        2. Permisos → Ubicación → Permitir<br>
        3. Recarga la página
      `,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Recargar', handler: () => window.location.reload() }
      ]
    });
    await alert.present();
  }

  private usarUbicacionPorDefecto() {
    this.currentLocation = [-41.4693, -72.9424]; // Puerto Montt
    if (this.map) {
      this.map.setView(this.currentLocation, 13);
    }
  }

  private addCurrentLocationMarker(): void {
    if (!this.currentLocation || !this.map) return;

    const icon = this.createUserLocationIcon();

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker(this.currentLocation, { icon })
      .addTo(this.map)
      .bindPopup(`<b>Tu</b>`)
      .openPopup();
  }

  // ───────────────── LEAFLET ICONS / MAP ─────────────────
  private fixLeafletIcons(): void {
    this.defaultIcon = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = this.defaultIcon;
  }

  private initMap(): void {
    const defaultLocation: [number, number] = [-41.4693, -72.9424];
    const initialLocation = this.currentLocation || defaultLocation;

    this.map = L.map('map', {
      center: initialLocation,
      zoom: this.currentLocation ? 15 : 13,
      zoomControl: true,
      preferCanvas: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      trackResize: true
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      minZoom: 10,
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: false,
      updateInterval: 200,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      crossOrigin: true,
      opacity: 1.0,
      className: 'map-tiles'
    });

    tileLayer.addTo(this.map);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.mostrarServiciosEnMapa();
      }
    }, 200);

    if (this.currentLocation) {
      this.addCurrentLocationMarker();
    }
  }

  // ───────────────── ÍCONOS PERSONALIZADOS DE SERVICIOS ─────────────────
  /** Crea un icono Leaflet a partir de una imagen en assets */
  private createServiceIcon(iconUrl: string): L.Icon {
    return L.icon({
      iconUrl,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -30],
      className: 'servicio-marker-icon'
    });
  }

  /** Inicializa el diccionario de iconos según tipo de categoría */
  private initServiceIcons() {
    this.servicioIcons['restaurante']      = this.createServiceIcon('assets/icon/restaurante.png');
    this.servicioIcons['agencia']          = this.createServiceIcon('assets/icon/agencia.jpg');
    this.servicioIcons['transporte']       = this.createServiceIcon('assets/icon/transporte.png');
    this.servicioIcons['parque']           = this.createServiceIcon('assets/icon/parque.jpg');
    this.servicioIcons['museo']            = this.createServiceIcon('assets/icon/museo.png');
    this.servicioIcons['plaza']            = this.createServiceIcon('assets/icon/plaza.png');
    this.servicioIcons['hotel']            = this.createServiceIcon('assets/icon/hotel.png');
    this.servicioIcons['mall']             = this.createServiceIcon('assets/icon/mall.jpeg');
    this.servicioIcons['playa']            = this.createServiceIcon('assets/icon/playa.png');
    this.servicioIcons['salud']            = this.createServiceIcon('assets/icon/salud.png');
    this.servicioIcons['biblioteca']       = this.createServiceIcon('assets/icon/biblioteca.png');
    this.servicioIcons['aeropuerto']       = this.createServiceIcon('assets/icon/aeropuerto.png');
    this.servicioIcons['puerto']           = this.createServiceIcon('assets/icon/puerto.png');
    this.servicioIcons['teatro']           = this.createServiceIcon('assets/icon/teatro.png');
    this.servicioIcons['gimnasio']         = this.createServiceIcon('assets/icon/gimnasio.png');
  }

  /** Devuelve el icono correspondiente a la categoría del servicio */
  private getIconForServicio(servicio: any): L.Icon {
    const categoria: string = (servicio.categoria_lugar || '').toLowerCase();

    if (categoria.includes('restaurante'))        return this.servicioIcons['restaurante']  || this.defaultIcon;
    if (categoria.includes('agencia'))            return this.servicioIcons['agencia']      || this.defaultIcon;
    if (categoria.includes('transporte'))         return this.servicioIcons['transporte']   || this.defaultIcon;
    if (categoria.includes('parque'))             return this.servicioIcons['parque']       || this.defaultIcon;
    if (categoria.includes('museo'))              return this.servicioIcons['museo']        || this.defaultIcon;
    if (categoria.includes('plaza'))              return this.servicioIcons['plaza']        || this.defaultIcon;
    if (categoria.includes('hotel'))              return this.servicioIcons['hotel']        || this.defaultIcon;
    if (categoria.includes('centro comercial') ||
        categoria.includes('mall'))               return this.servicioIcons['mall']         || this.defaultIcon;
    if (categoria.includes('playa'))              return this.servicioIcons['playa']        || this.defaultIcon;
    if (categoria.includes('centro de salud') ||
        categoria.includes('clínica') ||
        categoria.includes('clinica'))            return this.servicioIcons['salud']        || this.defaultIcon;
    if (categoria.includes('biblioteca'))         return this.servicioIcons['biblioteca']   || this.defaultIcon;
    if (categoria.includes('terminal aéreo') ||
        categoria.includes('terminal aereo') ||
        categoria.includes('aeropuerto'))         return this.servicioIcons['aeropuerto']   || this.defaultIcon;
    if (categoria.includes('terminal marítimo') ||
        categoria.includes('terminal maritimo') ||
        categoria.includes('puerto'))             return this.servicioIcons['puerto']       || this.defaultIcon;
    if (categoria.includes('teatro'))             return this.servicioIcons['teatro']       || this.defaultIcon;
    if (categoria.includes('gimnasio'))           return this.servicioIcons['gimnasio']     || this.defaultIcon;

    // por si aparece alguna categoría nueva
    return this.defaultIcon;
  }

  // ───────────────── GRABAR RUTA ─────────────────
  async startRecording() {
    if (!this.isUserLoggedIn) {
      const alert = await this.alertController.create({
        header: '🔒 Inicio de Sesión Requerido',
        message: 'Debes iniciar sesión para poder grabar rutas.<br><br>¿Deseas ir a la página de login?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Ir a Login', handler: () => this.router.navigate(['/login']) }
        ]
      });
      await alert.present();
      return;
    }

    if (!this.currentUserId) {
      await this.showToast('⚠️ Error al obtener usuario', 'warning');
      return;
    }

    if (!navigator.geolocation) {
      await this.showToast('❌ Geolocalización no disponible', 'danger');
      return;
    }

    try {
      this.isRecording = true;
      this.recordedPoints = [];
      this.totalDistance = 0;
      this.startTime = Date.now();
      this.lastMapUpdate = 0;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const startPoint = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            timestamp: Date.now()
          };

          this.recordedPoints.push(startPoint);
          this.currentLocation = [startPoint.latitud, startPoint.longitud];

          const icon = this.createColoredIcon('green');
          this.startMarker = L.marker([startPoint.latitud, startPoint.longitud], { icon })
            .addTo(this.map)
            .bindPopup('<b>🚩 Inicio de tu ruta</b>')
            .openPopup();

          this.map.setView([startPoint.latitud, startPoint.longitud], 18, {
            animate: true,
            duration: 0.5
          });

          this.watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (this.isRecording) {
                this.updateRecording(pos);
              }
            },
            (error) => console.error('❌ Error tracking:', error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 2000
            }
          );

          this.recordingInterval = setInterval(() => {
            if (this.isRecording) {
              this.updateElapsedTime();
            }
          }, 1000);

          this.showToast('✅ Grabación iniciada. ¡Camina!', 'success');
        },
        () => {
          this.showToast('❌ Error al obtener ubicación inicial', 'danger');
          this.isRecording = false;
        }
      );

    } catch {
      await this.showToast('❌ Error al iniciar grabación', 'danger');
      this.isRecording = false;
    }
  }

  private updateRecording(position: GeolocationPosition) {
    const newPoint = {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude,
      timestamp: Date.now()
    };

    const lastPoint = this.recordedPoints[this.recordedPoints.length - 1];
    const distance = this.calculateDistance(
      lastPoint.latitud,
      lastPoint.longitud,
      newPoint.latitud,
      newPoint.longitud
    );

    if (distance > 0.003) {
      this.recordedPoints.push(newPoint);
      this.totalDistance += distance;

      const timeDiff = (newPoint.timestamp - lastPoint.timestamp) / 1000;
      if (timeDiff > 0) {
        this.currentSpeed = (distance / timeDiff) * 3600;
      }

      this.updatePolyline();
      this.updateCurrentMarker(newPoint.latitud, newPoint.longitud);
    }
  }

  private updatePolyline() {
    const coords = this.recordedPoints.map(p => [p.latitud, p.longitud] as [number, number]);

    if (this.recordingPolyline) {
      this.map.removeLayer(this.recordingPolyline);
    }

    this.recordingPolyline = L.polyline(coords, {
      color: '#ff0000',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 5',
      smoothFactor: 1.0
    }).addTo(this.map);
  }

  private updateCurrentMarker(lat: number, lng: number) {
    const icon = this.createColoredIcon('blue');

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(`<b>📍 Tu ubicación</b><br>Velocidad: ${this.currentSpeed.toFixed(1)} km/h`);
  }

  private updateElapsedTime() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    this.elapsedTime = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  async stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.recordedPoints.length > 1) {
      const lastPoint = this.recordedPoints[this.recordedPoints.length - 1];

      const icon = this.createColoredIcon('red');
      L.marker([lastPoint.latitud, lastPoint.longitud], { icon })
        .addTo(this.map)
        .bindPopup('<b>🏁 Fin de tu ruta</b>')
        .openPopup();

      await this.showSaveDialog();
    } else {
      await this.showToast('⚠️ No se grabaron suficientes puntos', 'warning');
      this.clearRecording();
    }
  }

  async showSaveDialog() {
    const alert = await this.alertController.create({
      header: '💾 Guardar Ruta GPS',
      message: `
        <b>📏 Distancia:</b> ${this.totalDistance.toFixed(2)} km<br>
        <b>⏱️ Tiempo:</b> ${this.elapsedTime}<br>
        <b>📍 Puntos:</b> ${this.recordedPoints.length}
      `,
      inputs: [
        {
          name: 'nombre_ruta',
          type: 'text',
          placeholder: 'Ej: Ruta al Parque Accesible'
        },
        {
          name: 'descripcion',
          type: 'textarea',
          placeholder: 'Descripción (opcional)'
        }
      ],
      buttons: [
        {
          text: '🗑️ Descartar',
          role: 'cancel',
          handler: () => this.clearRecording()
        },
        {
          text: '💾 Guardar',
          handler: (data) => {
            if (!data.nombre_ruta?.trim()) {
              this.showToast('⚠️ Debes ingresar un nombre', 'warning');
              return false;
            }
            this.saveRoute(data.nombre_ruta, data.descripcion);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async saveRoute(nombre: string, descripcion: string) {
    const rutaData = {
      nombre_ruta: nombre.trim(),
      descripcion_ruta: descripcion?.trim() || '',
      id_tipo_ruta: 1,
      id_usuario: this.currentUserId,
      longitud_ruta: parseFloat(this.totalDistance.toFixed(2)),
      coordenadas: this.recordedPoints.map(p => ({
        latitud: p.latitud,
        longitud: p.longitud
      }))
    };

    this.http.post(`${this.apiUrl}/rutas`, rutaData).subscribe({
      next: async () => {
        await this.showToast(`✅ Ruta "${nombre}" guardada`, 'success');
        this.clearRecording();
        this.cargarRutasGuardadas();
      },
      error: async () => {
        await this.showToast('❌ Error al guardar la ruta', 'danger');
      }
    });
  }

  private clearRecording() {
    this.recordedPoints = [];
    this.totalDistance = 0;
    this.elapsedTime = '00:00:00';
    this.currentSpeed = 0;

    if (this.recordingPolyline) {
      this.map.removeLayer(this.recordingPolyline);
      this.recordingPolyline = null;
    }

    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
      this.startMarker = null;
    }
  }

  // ───────────────── RUTAS GUARDADAS / PÚBLICAS ─────────────────
  private cargarRutasGuardadas() {
    if (!this.currentUserId) return;

    this.http.get(`${this.apiUrl}/rutas/usuario/${this.currentUserId}`).subscribe({
      next: async (rutas: any) => {
        this.rutasGuardadas = [];

        for (const ruta of rutas) {
          try {
            const rutaDetalle: any = await this.http.get(`${this.apiUrl}/rutas/${ruta.id_ruta}`).toPromise();
            this.rutasGuardadas.push(rutaDetalle);
          } catch (err) {
            console.error('Error cargando ruta:', err);
          }
        }
      },
      error: (err) => console.error('Error cargando rutas:', err)
    });
  }

  private cargarRutasPublicas() {
    this.http.get(`${this.apiUrl}/rutas`).subscribe({
      next: async (todasRutas: any) => {
        this.rutasPublicas = [];

        for (const ruta of todasRutas) {
          if (ruta.id_usuario !== this.currentUserId) {
            try {
              const rutaDetalle: any = await this.http.get(`${this.apiUrl}/rutas/${ruta.id_ruta}`).toPromise();
              this.rutasPublicas.push(rutaDetalle);
            } catch (err) {
              console.error('Error cargando ruta pública:', err);
            }
          }
        }
      },
      error: (err) => console.error('Error cargando rutas públicas:', err)
    });
  }

  private mostrarTodasLasRutas() {
    this.limpiarRutasDelMapa();

    if (this.rutasGuardadas.length === 0) {
      this.showToast('📍 No tienes rutas guardadas', 'primary');
      return;
    }

    const colorPalette = ['#0066ff', '#00cc44', '#ff6600', '#cc00cc', '#ffcc00', '#00cccc'];

    this.rutasGuardadas.forEach((ruta, index) => {
      if (!ruta.coordenadas || ruta.coordenadas.length < 2) return;

      const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);
      const color = colorPalette[index % colorPalette.length];

      const polyline = L.polyline(coords, {
        color: color,
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1.0,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(this.map);

      this.rutasPolylines.push(polyline);

      L.marker(coords[0])
        .addTo(this.map)
        .bindPopup(`
          <b>🚩 ${ruta.nombre_ruta}</b><br>
          ${ruta.descripcion_ruta || ''}<br>
          <small>📏 ${ruta.longitud_ruta} km | ${coords.length} puntos</small>
        `);

      L.marker(coords[coords.length - 1])
        .addTo(this.map)
        .bindPopup(`<b>🏁 ${ruta.nombre_ruta}</b>`);
    });

    if (this.rutasPolylines.length > 0) {
      const group = L.featureGroup(this.rutasPolylines);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
    }

    this.showToast(`✅ Mostrando ${this.rutasGuardadas.length} ruta(s)`, 'success');
  }

  private mostrarRutasPublicas() {
    this.limpiarRutasDelMapa();

    if (this.rutasPublicas.length === 0) {
      this.showToast('🌍 No hay rutas públicas disponibles', 'primary');
      return;
    }

    const colorPalette = ['#9b59b6', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#1abc9c'];

    this.rutasPublicas.forEach((ruta, index) => {
      if (!ruta.coordenadas || ruta.coordenadas.length < 2) return;

      const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);
      const color = colorPalette[index % colorPalette.length];

      const polyline = L.polyline(coords, {
        color: color,
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1.0,
        lineJoin: 'round',
        lineCap: 'round',
        dashArray: '5, 10'
      }).addTo(this.map);

      this.rutasPolylines.push(polyline);

      L.marker(coords[0])
        .addTo(this.map)
        .bindPopup(`
          <b>🌍 ${ruta.nombre_ruta}</b><br>
          <small>👤 Por: ${ruta.usuario_nombre || 'Usuario'}</small><br>
          ${ruta.descripcion_ruta || ''}<br>
          <small>📏 ${ruta.longitud_ruta} km | ${coords.length} puntos</small>
        `);

      L.marker(coords[coords.length - 1])
        .addTo(this.map)
        .bindPopup(`<b>🏁 ${ruta.nombre_ruta}</b>`);
    });

    if (this.rutasPolylines.length > 0) {
      const group = L.featureGroup(this.rutasPolylines);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
    }

    this.showToast(`✅ Mostrando ${this.rutasPublicas.length} ruta(s) pública(s)`, 'success');
  }

  private limpiarRutasDelMapa() {
    this.rutasPolylines.forEach(p => this.map.removeLayer(p));
    this.rutasPolylines = [];
  }

  // ───────────────── MENÚ RUTAS / ACCIONES ─────────────────
  async verMisRutas() {
    if (!this.isUserLoggedIn) {
      const alert = await this.alertController.create({
        header: '🔒 Inicio de Sesión Requerido',
        message: 'Debes iniciar sesión para ver tus rutas guardadas.<br><br>¿Deseas ir a la página de login?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Ir a Login', handler: () => this.router.navigate(['/login']) }
        ]
      });
      await alert.present();
      return;
    }

    if (this.rutasGuardadas.length === 0) {
      await this.showToast('📍 No tienes rutas guardadas', 'primary');
      return;
    }

    await this.showRutasActionSheet();
  }

  async verRutasPublicas() {
    if (this.rutasPublicas.length === 0) {
      await this.showToast('🌍 No hay rutas públicas disponibles', 'primary');
      return;
    }

    await this.showRutasPublicasActionSheet();
  }

  async showRutasActionSheet() {
    const buttons: any[] = [];

    buttons.push({
      text: `🗺️ Mostrar todas mis rutas (${this.rutasGuardadas.length})`,
      icon: 'map',
      handler: () => {
        this.mostrarTodasLasRutas();
        return true;
      }
    });

    buttons.push({
      text: '🧹 Limpiar mapa',
      icon: 'close-circle',
      handler: () => {
        this.limpiarRutasDelMapa();
        this.showToast('✅ Mapa limpiado', 'success');
        return true;
      }
    });

    this.rutasGuardadas.forEach(ruta => {
      buttons.push({
        text: `📍 ${ruta.nombre_ruta} (${ruta.longitud_ruta} km)`,
        icon: 'navigate',
        handler: () => {
          this.mostrarOpcionesRuta(ruta);
          return true;
        }
      });
    });

    buttons.push({
      text: '🔄 Recargar',
      icon: 'refresh',
      handler: () => {
        this.cargarRutasGuardadas();
        return true;
      }
    });

    buttons.push({
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: '📍 Mis Rutas GPS',
      subHeader: `${this.rutasGuardadas.length} ruta(s)`,
      buttons: buttons
    });

    await actionSheet.present();
  }

  async mostrarOpcionesRuta(ruta: any) {
    const actionSheet = await this.actionSheetController.create({
      header: ruta.nombre_ruta,
      subHeader: `${ruta.longitud_ruta} km • ${ruta.coordenadas?.length || 0} puntos`,
      buttons: [
        {
          text: '👁️ Ver en el mapa',
          icon: 'eye',
          handler: () => {
            this.cargarRutaEnMapa(ruta.id_ruta);
            return true;
          }
        },
        {
          text: '🗑️ Eliminar ruta',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminarRuta(ruta);
            return true;
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async confirmarEliminarRuta(ruta: any) {
    const alert = await this.alertController.create({
      header: '⚠️ Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la ruta "<b>${ruta.nombre_ruta}</b>"?<br><br>Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarRuta(ruta.id_ruta)
        }
      ]
    });

    await alert.present();
  }

  async eliminarRuta(idRuta: number) {
    this.http.delete(`${this.apiUrl}/rutas/${idRuta}`).subscribe({
      next: async () => {
        await this.showToast('✅ Ruta eliminada correctamente', 'success');
        this.limpiarRutasDelMapa();
        this.cargarRutasGuardadas();
      },
      error: async () => {
        await this.showToast('❌ Error al eliminar la ruta', 'danger');
      }
    });
  }

  async showRutasPublicasActionSheet() {
    const buttons: any[] = [];

    buttons.push({
      text: `🌍 Mostrar todas las rutas públicas (${this.rutasPublicas.length})`,
      icon: 'globe',
      handler: () => {
        this.mostrarRutasPublicas();
        return true;
      }
    });

    buttons.push({
      text: '🧹 Limpiar mapa',
      icon: 'close-circle',
      handler: () => {
        this.limpiarRutasDelMapa();
        this.showToast('✅ Mapa limpiado', 'success');
        return true;
      }
    });

    this.rutasPublicas.forEach(ruta => {
      buttons.push({
        text: `🌍 ${ruta.nombre_ruta} (${ruta.longitud_ruta} km) - ${ruta.usuario_nombre || 'Usuario'}`,
        icon: 'navigate-circle',
        handler: () => {
          this.cargarRutaEnMapa(ruta.id_ruta, true);
          return true;
        }
      });
    });

    buttons.push({
      text: '🔄 Recargar',
      icon: 'refresh',
      handler: () => {
        this.cargarRutasPublicas();
        return true;
      }
    });

    buttons.push({
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: '🌍 Rutas de Otros Usuarios',
      subHeader: `${this.rutasPublicas.length} ruta(s) disponible(s)`,
      buttons: buttons
    });

    await actionSheet.present();
  }

  async cargarRutaEnMapa(idRuta: number, esPublica: boolean = false) {
    const rutas = esPublica ? this.rutasPublicas : this.rutasGuardadas;
    const ruta = rutas.find((r: any) => r.id_ruta === idRuta);
    if (!ruta) return;

    this.limpiarRutasDelMapa();

    const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);

    const color = esPublica ? '#9b59b6' : '#0066ff';
    const dashArray = esPublica ? '5, 10' : undefined;

    const polyline = L.polyline(coords, {
      color: color,
      weight: 6,
      opacity: 0.9,
      smoothFactor: 1.0,
      lineJoin: 'round',
      lineCap: 'round',
      dashArray: dashArray
    }).addTo(this.map);

    this.rutasPolylines.push(polyline);

    const startMarker = L.marker(coords[0])
      .addTo(this.map)
      .bindPopup(`
        <b>${esPublica ? '🌍' : '🚩'} Inicio: ${ruta.nombre_ruta}</b><br>
        ${esPublica ? `<small>👤 Por: ${ruta.usuario_nombre || 'Usuario'}</small><br>` : ''}
        ${ruta.descripcion_ruta || ''}<br>
        <small>📏 Distancia total: ${ruta.longitud_ruta} km</small><br>
        <small>📍 Puntos GPS: ${coords.length}</small>
      `);

    const endMarker = L.marker(coords[coords.length - 1])
      .addTo(this.map)
      .bindPopup(`<b>🏁 Fin: ${ruta.nombre_ruta}</b>`);

    startMarker.openPopup();

    const bounds = L.latLngBounds(coords);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });

    await this.showToast(`📍 ${ruta.nombre_ruta} - ${ruta.longitud_ruta} km`, 'primary');
  }

  // ───────────────── UTILIDADES ─────────────────
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // 🔹 Ahora todos los marcadores de ruta usan el mismo icono por fiabilidad
  private createColoredIcon(color: string): L.Icon {
    return this.defaultIcon || (L.Marker.prototype.options.icon as L.Icon);
  }

  private createUserLocationIcon(): L.DivIcon {
    return L.divIcon({
      className: 'user-location-icon',
      html: `
        <div style="position: relative;">
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <!-- Círculo exterior (borde blanco) -->
            <circle cx="20" cy="20" r="18" fill="#fff" stroke="#2196F3" stroke-width="2"/>
            <!-- Círculo interior azul -->
            <circle cx="20" cy="20" r="15" fill="#2196F3"/>
            <!-- Icono de persona -->
            <g fill="#fff">
              <!-- Cabeza -->
              <circle cx="20" cy="15" r="4"/>
              <!-- Cuerpo -->
              <path d="M 20 19 Q 15 19 13 25 L 13 28 L 27 28 L 27 25 Q 25 19 20 19 Z"/>
            </g>
          </svg>
          <!-- Punto central pulsante -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: #fff;
            border: 2px solid #2196F3;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  calcularDistanciaTotal(): string {
    const total = this.rutasGuardadas.reduce((sum, ruta) => sum + (ruta.longitud_ruta || 0), 0);
    return total.toFixed(2);
  }
}
