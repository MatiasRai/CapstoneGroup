import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { Platform, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
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

  // 🎯 Variables para tracking de ruta
  isRecording: boolean = false;
  recordedPoints: { latitud: number; longitud: number; timestamp: number }[] = [];
  recordingPolyline: L.Polyline | null = null;
  startMarker: L.Marker | null = null;
  currentMarker: L.Marker | null = null;
  watchId: number | null = null;
  totalDistance: number = 0;
  startTime: number = 0;
  recordingInterval: any = null;
  
  // 📊 Estadísticas en vivo
  currentSpeed: number = 0;
  elapsedTime: string = '00:00:00';
  
  // 📍 Rutas guardadas
  rutasGuardadas: any[] = [];
  rutasPolylines: L.Polyline[] = [];
  
  // 🗺️ Control de actualización del mapa
  private lastMapUpdate: number = 0;
  private mapUpdateThrottle: number = 1000; // 1 segundo entre actualizaciones

  constructor(
    private platform: Platform,
    private http: HttpClient,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.getCurrentPosition();
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    this.initMap();
  }

  ngOnDestroy() {
    this.stopRecording();
  }

  // 👤 Cargar usuario desde localStorage
  private loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
      console.log('✅ Usuario cargado:', this.currentUserId);
      
      if (this.currentUserId) {
        this.cargarRutasGuardadas(); // Solo carga la lista, NO las muestra
      }
    }
  }

  // 📍 Obtener ubicación actual
  async getCurrentPosition() {
    try {
      console.log('🔍 Solicitando ubicación GPS...');

      if (!navigator.geolocation) {
        console.error('❌ Geolocation no disponible');
        await this.showToast('⚠️ Tu navegador no soporta geolocalización', 'danger');
        this.usarUbicacionPorDefecto();
        return;
      }

      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        console.warn('⚠️ La geolocalización puede no funcionar en HTTP');
        await this.showAlertHTTPS();
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = [
            position.coords.latitude,
            position.coords.longitude
          ];
          
          console.log('✅ GPS obtenido:', this.currentLocation);
          console.log('📊 Precisión:', position.coords.accuracy, 'metros');
          
          if (this.map) {
            this.map.setView(this.currentLocation, 17);
            this.addCurrentLocationMarker();
          }
          
          this.showToast('✅ GPS conectado correctamente', 'success');
        },
        (error) => {
          console.error('❌ Error GPS:', error);
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );

    } catch (error: any) {
      console.error('❌ Error al obtener GPS:', error);
      await this.showToast(`⚠️ Error GPS: ${error.message}`, 'warning');
      this.usarUbicacionPorDefecto();
    }
  }

  // 🚨 Manejo de errores
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
        Necesitamos acceso a tu ubicación para grabar rutas.
        <br><br>
        <b>Para activarlo:</b>
        <br>1. Click en el 🔒 en la barra de direcciones
        <br>2. Permisos → Ubicación → Permitir
        <br>3. Recarga la página
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Recargar',
          handler: () => {
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
  }

  // 🗺️ Ubicación por defecto
  private usarUbicacionPorDefecto() {
    this.currentLocation = [-41.4693, -72.9424];
    if (this.map) {
      this.map.setView(this.currentLocation, 13);
    }
    console.log('📍 Usando ubicación por defecto: Puerto Montt');
  }

  // 🧭 Añadir marcador de ubicación actual
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

  // 🧭 Fix íconos de Leaflet
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

  // 🗺️ Inicializar mapa - SIN MOSTRAR RUTAS AUTOMÁTICAMENTE
  private initMap(): void {
    const defaultLocation: [number, number] = [-41.4693, -72.9424];
    const initialLocation = this.currentLocation || defaultLocation;

    this.map = L.map('map', {
      center: initialLocation,
      zoom: this.currentLocation ? 17 : 13,
      zoomControl: true,
      // Configuración optimizada para evitar tiles grises
      preferCanvas: false, // Canvas puede causar problemas con tiles
      zoomAnimation: false, // Desactivar animaciones durante grabación
      fadeAnimation: false,
      markerZoomAnimation: false,
      // Importante: no mover el mapa automáticamente
      trackResize: true
    });

    // 🔧 SOLUCIÓN: Tiles con mejor configuración
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      minZoom: 10,
      // ✅ CLAVE: Configuración para mantener tiles cargadas
      keepBuffer: 4, // Aumentado de 2 a 4
      updateWhenIdle: true, // Cambiado a true
      updateWhenZooming: true, // Cambiado a true
      updateInterval: 200,
      // Tiles de respaldo
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      // Configuración de carga
      crossOrigin: true,
      // Importante: mantener tiles antiguas mientras cargan nuevas
      opacity: 1.0,
      className: 'map-tiles'
    });

    tileLayer.addTo(this.map);

    // Manejar errores de tiles
    tileLayer.on('tileerror', (error: any) => {
      console.warn('⚠️ Error cargando tile, intentando recargar...');
    });

    // Precargar tiles al iniciar
    tileLayer.on('load', () => {
      console.log('✅ Tiles del mapa cargadas');
    });

    if (this.currentLocation) {
      this.addCurrentLocationMarker();
    }

    // ✅ NO mostrar rutas automáticamente
    console.log('🗺️ Mapa inicializado. Las rutas NO se muestran automáticamente.');
  }

  // 🎬 INICIAR GRABACIÓN
  async startRecording() {
    if (!this.currentUserId) {
      await this.showToast('⚠️ Debes iniciar sesión para grabar rutas', 'warning');
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
      this.lastMapUpdate = 0; // Reset throttle

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const startPoint = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            timestamp: Date.now()
          };
          
          this.recordedPoints.push(startPoint);
          this.currentLocation = [startPoint.latitud, startPoint.longitud];

          console.log('🚩 Inicio grabación:', startPoint);

          const greenIcon = this.createColoredIcon('green');
          this.startMarker = L.marker([startPoint.latitud, startPoint.longitud], { icon: greenIcon })
            .addTo(this.map)
            .bindPopup('<b>🚩 Inicio de tu ruta</b>')
            .openPopup();

          this.map.setView([startPoint.latitud, startPoint.longitud], 18, {
            animate: true,
            duration: 0.5
          });

          // Tracking continuo con throttling
          this.watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (this.isRecording) {
                this.updateRecording(pos);
              }
            },
            (error) => console.error('❌ Error tracking:', error),
            {
              enableHighAccuracy: true,
              timeout: 10000, // Aumentado a 10 segundos
              maximumAge: 2000 // Permitir datos de hace 2 segundos
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
          console.error('❌ Error posición inicial:', error);
          this.showToast('❌ Error al obtener ubicación inicial', 'danger');
          this.isRecording = false;
        }
      );

    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      await this.showToast('❌ Error al iniciar grabación', 'danger');
      this.isRecording = false;
    }
  }

  // 📍 Actualizar grabación - SIN MOVER EL MAPA (evita tiles grises)
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

    // Solo registrar si se movió más de 3 metros
    if (distance > 0.003) {
      this.recordedPoints.push(newPoint);
      this.totalDistance += distance;

      const timeDiff = (newPoint.timestamp - lastPoint.timestamp) / 1000;
      if (timeDiff > 0) {
        this.currentSpeed = (distance / timeDiff) * 3600;
      }

      // Actualizar polyline y marcador
      this.updatePolyline();
      this.updateCurrentMarker(newPoint.latitud, newPoint.longitud);
      
      // 🔧 SOLUCIÓN: NO MOVER EL MAPA durante la grabación
      // El usuario puede mover el mapa manualmente si quiere
      // Esto evita que las tiles se pongan grises
      
      console.log(`📍 Punto #${this.recordedPoints.length} | ${this.totalDistance.toFixed(3)} km`);
    }
  }

  // 🗺️ Actualizar línea
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

  // 📍 Actualizar marcador actual
  private updateCurrentMarker(lat: number, lng: number) {
    const blueIcon = this.createColoredIcon('blue');

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker([lat, lng], { icon: blueIcon })
      .addTo(this.map)
      .bindPopup(`<b>📍 Tu ubicación</b><br>Velocidad: ${this.currentSpeed.toFixed(1)} km/h`);
  }

  // ⏱️ Actualizar tiempo
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

  // ⏹️ DETENER GRABACIÓN
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

    console.log(`🏁 Grabación finalizada. Puntos: ${this.recordedPoints.length}`);

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

  // 💾 Diálogo guardar
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

  // 💾 Guardar ruta
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
        this.cargarRutasGuardadas(); // Solo recarga la lista
      },
      error: async (error) => {
        console.error('❌ Error al guardar:', error);
        await this.showToast('❌ Error al guardar la ruta', 'danger');
      }
    });
  }

  // 🧹 Limpiar grabación
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

  // 📍 Cargar rutas guardadas - SOLO LA LISTA, NO LAS MUESTRA
  private cargarRutasGuardadas() {
    if (!this.currentUserId) return;

    this.http.get(`${this.apiUrl}/rutas/usuario/${this.currentUserId}`).subscribe({
      next: async (rutas: any) => {
        console.log(`📍 ${rutas.length} rutas cargadas (sin mostrar)`);
        
        this.rutasGuardadas = [];
        
        for (const ruta of rutas) {
          try {
            const rutaDetalle: any = await this.http.get(`${this.apiUrl}/rutas/${ruta.id_ruta}`).toPromise();
            this.rutasGuardadas.push(rutaDetalle);
          } catch (err) {
            console.error('Error cargando ruta:', err);
          }
        }
        
        // ✅ NO llamar a mostrarRutasEnMapa() aquí
      },
      error: (err) => console.error('Error cargando rutas:', err)
    });
  }

  // 🗺️ Mostrar TODAS las rutas en el mapa con LÍNEAS VISIBLES
  private mostrarTodasLasRutas() {
    // Limpiar rutas anteriores
    this.limpiarRutasDelMapa();

    if (this.rutasGuardadas.length === 0) {
      this.showToast('📍 No tienes rutas guardadas', 'primary');
      return;
    }

    // Colores brillantes y visibles
    const colorPalette = [
      '#0066ff', // Azul brillante
      '#00cc44', // Verde brillante
      '#ff6600', // Naranja brillante
      '#cc00cc', // Morado brillante
      '#ffcc00', // Amarillo brillante
      '#00cccc'  // Cyan brillante
    ];

    this.rutasGuardadas.forEach((ruta, index) => {
      if (!ruta.coordenadas || ruta.coordenadas.length < 2) return;

      const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);
      const color = colorPalette[index % colorPalette.length];

      // Dibujar línea del camino
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

      // Marcador inicio
      L.marker(coords[0], { icon: greenIcon })
        .addTo(this.map)
        .bindPopup(`
          <b>🚩 ${ruta.nombre_ruta}</b><br>
          ${ruta.descripcion_ruta || ''}<br>
          <small>📏 ${ruta.longitud_ruta} km | ${coords.length} puntos</small>
        `);

      // Marcador fin
      L.marker(coords[coords.length - 1], { icon: redIcon })
        .addTo(this.map)
        .bindPopup(`<b>🏁 ${ruta.nombre_ruta}</b>`);
    });

    // Ajustar vista para mostrar todas las rutas
    if (this.rutasPolylines.length > 0) {
      const group = L.featureGroup(this.rutasPolylines);
      this.map.fitBounds(group.getBounds(), { 
        padding: [50, 50],
        maxZoom: 16
      });
    }

    this.showToast(`✅ Mostrando ${this.rutasGuardadas.length} ruta(s)`, 'success');
  }

  // 🧹 Limpiar rutas del mapa
  private limpiarRutasDelMapa() {
    this.rutasPolylines.forEach(p => this.map.removeLayer(p));
    this.rutasPolylines = [];
  }

  // 📜 Ver mis rutas - AHORA CON OPCIÓN DE MOSTRAR TODAS
  async verMisRutas() {
    if (!this.currentUserId) {
      await this.showToast('⚠️ Debes iniciar sesión', 'warning');
      return;
    }

    if (this.rutasGuardadas.length === 0) {
      await this.showToast('📍 No tienes rutas guardadas', 'primary');
      return;
    }

    await this.showRutasActionSheet();
  }

  // 📋 ActionSheet de rutas con opción de mostrar todas
  async showRutasActionSheet() {
    const buttons: any[] = [];

    // Botón para mostrar todas las rutas
    buttons.push({
      text: `🗺️ Mostrar todas (${this.rutasGuardadas.length})`,
      icon: 'map',
      handler: () => {
        this.mostrarTodasLasRutas();
      }
    });

    // Botón para limpiar el mapa
    buttons.push({
      text: '🧹 Limpiar mapa',
      icon: 'close-circle',
      handler: () => {
        this.limpiarRutasDelMapa();
        this.showToast('✅ Mapa limpiado', 'success');
      }
    });

    // Lista de rutas individuales
    this.rutasGuardadas.forEach(ruta => {
      buttons.push({
        text: `${ruta.nombre_ruta} (${ruta.longitud_ruta} km)`,
        icon: 'navigate',
        handler: () => {
          this.cargarRutaEnMapa(ruta.id_ruta);
        }
      });
    });

    buttons.push({
      text: '🔄 Recargar',
      icon: 'refresh',
      handler: () => {
        this.cargarRutasGuardadas();
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

  // 🗺️ Cargar UNA ruta específica en el mapa con LÍNEA AZUL
  async cargarRutaEnMapa(idRuta: number) {
    const ruta = this.rutasGuardadas.find(r => r.id_ruta === idRuta);
    if (!ruta) return;

    // Limpiar rutas anteriores
    this.limpiarRutasDelMapa();

    const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);
    
    // 🔵 SOLUCIÓN: Dibujar la línea AZUL del camino completo
    const polyline = L.polyline(coords, {
      color: '#0066ff', // Azul brillante
      weight: 6,
      opacity: 0.9,
      smoothFactor: 1.0,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.map);

    this.rutasPolylines.push(polyline);

    // Marcadores inicio (verde) y fin (rojo)
    const greenIcon = this.createColoredIcon('green');
    const redIcon = this.createColoredIcon('red');

    const startMarker = L.marker(coords[0], { icon: greenIcon })
      .addTo(this.map)
      .bindPopup(`
        <b>🚩 Inicio: ${ruta.nombre_ruta}</b><br>
        ${ruta.descripcion_ruta || ''}<br>
        <small>📏 Distancia total: ${ruta.longitud_ruta} km</small><br>
        <small>📍 Puntos GPS: ${coords.length}</small>
      `);

    const endMarker = L.marker(coords[coords.length - 1], { icon: redIcon })
      .addTo(this.map)
      .bindPopup(`<b>🏁 Fin: ${ruta.nombre_ruta}</b>`);

    // Abrir popup del inicio automáticamente
    startMarker.openPopup();

    // Centrar mapa en la ruta con padding
    const bounds = L.latLngBounds(coords);
    this.map.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 17 
    });

    await this.showToast(`📍 ${ruta.nombre_ruta} - ${ruta.longitud_ruta} km`, 'primary');
  }

  // 📏 Calcular distancia
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

  // 🎨 Íconos de colores
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

  // 🍞 Toast
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // 📊 Distancia total
  calcularDistanciaTotal(): string {
    const total = this.rutasGuardadas.reduce((sum, ruta) => sum + (ruta.longitud_ruta || 0), 0);
    return total.toFixed(2);
  }
}