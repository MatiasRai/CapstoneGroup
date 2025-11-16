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
  private map!: L.Map;
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
  
  // 🆕 Servicios disponibles
  serviciosDisponibles: any[] = [];
  serviciosMarkers: L.Marker[] = [];
  
  private lastMapUpdate: number = 0;
  private mapUpdateThrottle: number = 1000;

  // 🆕 Estado de usuario
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

  ngOnInit() {
    this.loadCurrentUser();
    this.getCurrentPosition();
    this.cargarServiciosDisponibles(); // 🆕 Cargar servicios
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.stopRecording();
  }

  private loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
      this.isUserLoggedIn = true; // 🆕 Usuario logueado
      
      if (this.currentUserId) {
        this.cargarRutasGuardadas();
        this.cargarRutasPublicas();
      }
    } else {
      this.isUserLoggedIn = false; // 🆕 No hay usuario logueado
      this.cargarRutasPublicas(); // Cargar solo rutas públicas
    }
  }

  /* ======================================================
     🆕 CARGAR SERVICIOS DISPONIBLES
  ====================================================== */
  cargarServiciosDisponibles() {
    this.admEmpresaService.obtenerTodosLosServicios().subscribe({
      next: (servicios: any[]) => {
        this.serviciosDisponibles = servicios.filter(s => s.latitud && s.longitud);
        console.log('🧩 Servicios cargados:', this.serviciosDisponibles.length);
        
        // Mostrar servicios en el mapa si ya está inicializado
        if (this.map) {
          this.mostrarServiciosEnMapa();
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar servicios:', err);
      }
    });
  }

  /* ======================================================
     🆕 MOSTRAR SERVICIOS EN EL MAPA
  ====================================================== */
  private mostrarServiciosEnMapa() {
    // Limpiar marcadores anteriores de servicios
    this.serviciosMarkers.forEach(marker => this.map.removeLayer(marker));
    this.serviciosMarkers = [];

    // Crear ícono personalizado para servicios
    const servicioIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
      iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Agregar marcador para cada servicio
    this.serviciosDisponibles.forEach(servicio => {
      if (servicio.latitud && servicio.longitud) {
        const marker = L.marker([servicio.latitud, servicio.longitud], { icon: servicioIcon })
          .addTo(this.map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #f39c12;">🧩 ${servicio.nombre_servicio}</h3>
              <p style="margin: 4px 0;"><strong>Empresa:</strong> ${servicio.nombre_empresa || 'N/A'}</p>
              <p style="margin: 4px 0;">${servicio.descripcion_servicio || 'Sin descripción'}</p>
              <p style="margin: 4px 0;"><strong>📍 Lugar:</strong> ${servicio.nombre_lugar || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>📍 Dirección:</strong> ${servicio.direccion_lugar || 'N/A'}</p>
              ${servicio.horario_disponible ? `<p style="margin: 4px 0;"><strong>🕒 Horario:</strong> ${servicio.horario_disponible}</p>` : ''}
              <p style="margin: 4px 0;"><strong>💰 Costo:</strong> ${servicio.costo_servicio ? servicio.costo_servicio.toLocaleString('es-CL', {style: 'currency', currency: 'CLP'}) : 'Consultar'}</p>
              ${servicio.nombre_discapacidad ? `<p style="margin: 4px 0;"><strong>♿ Discapacidad:</strong> ${servicio.nombre_discapacidad}</p>` : ''}
              ${servicio.empresa_telefono ? `<p style="margin: 4px 0;"><strong>📞 Contacto:</strong> ${servicio.empresa_telefono}</p>` : ''}
              ${servicio.resenas && servicio.resenas.length > 0 ? `<p style="margin: 4px 0;"><strong>⭐ Valoración:</strong> ${this.calcularPromedioValoracion(servicio.resenas)}/5 (${servicio.resenas.length} reseña${servicio.resenas.length > 1 ? 's' : ''})</p>` : ''}
            </div>
          `);

        this.serviciosMarkers.push(marker);
      }
    });

    console.log(`✅ ${this.serviciosMarkers.length} servicios mostrados en el mapa`);
  }

  /* ======================================================
     🆕 CALCULAR PROMEDIO DE VALORACIÓN
  ====================================================== */
  calcularPromedioValoracion(resenas: any[]): string {
    if (!resenas || resenas.length === 0) return '0.0';
    const suma = resenas.reduce((acc, r) => acc + (r.valoracion || 0), 0);
    return (suma / resenas.length).toFixed(1);
  }

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
            this.map.setView(this.currentLocation, 15); // Zoom 15 para ver servicios cercanos
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
    this.currentLocation = [-41.4693, -72.9424]; // Puerto Montt por defecto
    if (this.map) {
      this.map.setView(this.currentLocation, 13);
    }
  }

  private addCurrentLocationMarker(): void {
    if (!this.currentLocation || !this.map) return;

    const blueIcon = this.createColoredIcon('blue');

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker(this.currentLocation, { icon: blueIcon })
      .addTo(this.map)
      .bindPopup(`
        <b>📍 Tu ubicación GPS</b><br>
        <small>Lat: ${this.currentLocation[0].toFixed(6)}</small><br>
        <small>Lng: ${this.currentLocation[1].toFixed(6)}</small>
      `)
      .openPopup();
  }

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
        // Mostrar servicios después de que el mapa esté listo
        this.mostrarServiciosEnMapa();
      }
    }, 200);

    if (this.currentLocation) {
      this.addCurrentLocationMarker();
    }
  }

  /* ======================================================
     🆕 VERIFICAR LOGIN ANTES DE GRABAR RUTA
  ====================================================== */
  async startRecording() {
    // 🔒 Verificar si el usuario está logueado
    if (!this.isUserLoggedIn) {
      const alert = await this.alertController.create({
        header: '🔒 Inicio de Sesión Requerido',
        message: 'Debes iniciar sesión para poder grabar rutas.<br><br>¿Deseas ir a la página de login?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Ir a Login',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }
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

          const greenIcon = this.createColoredIcon('green');
          this.startMarker = L.marker([startPoint.latitud, startPoint.longitud], { icon: greenIcon })
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
        (error) => {
          this.showToast('❌ Error al obtener ubicación inicial', 'danger');
          this.isRecording = false;
        }
      );

    } catch (error) {
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
    const blueIcon = this.createColoredIcon('blue');

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker([lat, lng], { icon: blueIcon })
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
      
      const redIcon = this.createColoredIcon('red');
      L.marker([lastPoint.latitud, lastPoint.longitud], { icon: redIcon })
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
      error: async (error) => {
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

      const greenIcon = this.createColoredIcon('green');
      const redIcon = this.createColoredIcon('red');

      L.marker(coords[0], { icon: greenIcon })
        .addTo(this.map)
        .bindPopup(`
          <b>🚩 ${ruta.nombre_ruta}</b><br>
          ${ruta.descripcion_ruta || ''}<br>
          <small>📏 ${ruta.longitud_ruta} km | ${coords.length} puntos</small>
        `);

      L.marker(coords[coords.length - 1], { icon: redIcon })
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

      const violetIcon = this.createColoredIcon('violet');
      const orangeIcon = this.createColoredIcon('orange');

      L.marker(coords[0], { icon: violetIcon })
        .addTo(this.map)
        .bindPopup(`
          <b>🌍 ${ruta.nombre_ruta}</b><br>
          <small>👤 Por: ${ruta.usuario_nombre || 'Usuario'}</small><br>
          ${ruta.descripcion_ruta || ''}<br>
          <small>📏 ${ruta.longitud_ruta} km | ${coords.length} puntos</small>
        `);

      L.marker(coords[coords.length - 1], { icon: orangeIcon })
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

  /* ======================================================
     🆕 FUNCIONES PARA INICIAR SESIÓN O REGISTRARSE
  ====================================================== */
  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

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
      error: async (error) => {
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
    const ruta = rutas.find(r => r.id_ruta === idRuta);
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

    const greenIcon = this.createColoredIcon(esPublica ? 'violet' : 'green');
    const redIcon = this.createColoredIcon(esPublica ? 'orange' : 'red');

    const startMarker = L.marker(coords[0], { icon: greenIcon })
      .addTo(this.map)
      .bindPopup(`
        <b>${esPublica ? '🌍' : '🚩'} Inicio: ${ruta.nombre_ruta}</b><br>
        ${esPublica ? `<small>👤 Por: ${ruta.usuario_nombre || 'Usuario'}</small><br>` : ''}
        ${ruta.descripcion_ruta || ''}<br>
        <small>📏 Distancia total: ${ruta.longitud_ruta} km</small><br>
        <small>📍 Puntos GPS: ${coords.length}</small>
      `);

    const endMarker = L.marker(coords[coords.length - 1], { icon: redIcon })
      .addTo(this.map)
      .bindPopup(`<b>🏁 Fin: ${ruta.nombre_ruta}</b>`);

    startMarker.openPopup();

    const bounds = L.latLngBounds(coords);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });

    await this.showToast(`📍 ${ruta.nombre_ruta} - ${ruta.longitud_ruta} km`, 'primary');
  }

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