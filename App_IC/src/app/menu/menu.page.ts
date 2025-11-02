import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { Platform, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';

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
  private host = window.location.hostname; // Detecta localhost o tu IP local
  private apiUrl = `http://${this.host}:3000/api/v1`;

  
  // 🎯 Variables para tracking de ruta en tiempo real
  isRecording: boolean = false;
  recordedPoints: { latitud: number; longitud: number; timestamp: number }[] = [];
  recordingPolyline: L.Polyline | null = null;
  startMarker: L.Marker | null = null;
  currentMarker: L.Marker | null = null;
  watchId: string | null = null;
  totalDistance: number = 0;
  startTime: number = 0;
  recordingInterval: any = null;
  
  // 📊 Estadísticas en vivo
  currentSpeed: number = 0;
  elapsedTime: string = '00:00:00';
  
  // 📍 Rutas guardadas del usuario
  rutasGuardadas: any[] = [];
  rutasPolylines: L.Polyline[] = [];

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

  // 👤 Cargar usuario actual desde localStorage
  private loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
      console.log('✅ Usuario cargado:', this.currentUserId);
      
      if (this.currentUserId) {
        this.cargarRutasGuardadas();
      }
    } else {
      console.warn('⚠️ No hay usuario logueado');
      this.showToast('⚠️ Inicia sesión para grabar rutas', 'warning');
    }
  }

  // 📍 Obtener ubicación actual - Compatible con WEB y MÓVIL
  async getCurrentPosition() {
    try {
      console.log('🔍 Solicitando ubicación...');
      
      // 🌐 PARA WEB: Usar API del navegador
      if (!this.platform.is('capacitor')) {
        console.log('🌐 Modo WEB detectado - Usando Geolocation API del navegador');
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.currentLocation = [
                position.coords.latitude,
                position.coords.longitude
              ];
              console.log('✅ GPS Web obtenido:', this.currentLocation);
              
              if (this.map) {
                this.map.setView(this.currentLocation, 17);
                this.addCurrentLocationMarker();
              }
              
              this.showToast('✅ GPS conectado correctamente', 'success');
            },
            (error) => {
              console.error('❌ Error GPS Web:', error.message);
              this.showToast('⚠️ No se pudo obtener ubicación', 'warning');
              this.usarUbicacionPorDefecto();
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          console.error('❌ Geolocation no disponible');
          this.showToast('⚠️ Tu navegador no soporta geolocalización', 'danger');
          this.usarUbicacionPorDefecto();
        }
        
        return;
      }

      // 📱 PARA MÓVIL: Usar Capacitor
      console.log('📱 Modo MÓVIL detectado - Usando Capacitor Geolocation');
      
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          await this.showToast('⚠️ Permiso de GPS denegado', 'warning');
          this.usarUbicacionPorDefecto();
          return;
        }
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      this.currentLocation = [
        coordinates.coords.latitude,
        coordinates.coords.longitude
      ];

      console.log('✅ GPS Móvil obtenido:', this.currentLocation);
      
      if (this.map) {
        this.map.setView(this.currentLocation, 17);
        this.addCurrentLocationMarker();
      }

      await this.showToast('✅ GPS conectado correctamente', 'success');

    } catch (error) {
      console.error('❌ Error al obtener GPS:', error);
      await this.showToast('⚠️ Error al conectar con GPS', 'warning');
      this.usarUbicacionPorDefecto();
    }
  }

  // 🗺️ Usar ubicación por defecto (Puerto Montt)
  private usarUbicacionPorDefecto() {
    this.currentLocation = [-41.4693, -72.9424];
    if (this.map) {
      this.map.setView(this.currentLocation, 13);
    }
    console.log('📍 Usando ubicación por defecto: Puerto Montt');
  }

  // 🧭 Añadir marcador de ubicación actual
  private addCurrentLocationMarker(): void {
    if (!this.currentLocation || !this.map) {
      console.log('⚠️ No hay ubicación o mapa para marcar');
      return;
    }

    const blueIcon = this.createColoredIcon('blue');

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker(this.currentLocation, { icon: blueIcon })
      .addTo(this.map)
      .bindPopup(`
        <b>📍 Tu ubicación GPS actual</b><br>
        <small>Lat: ${this.currentLocation[0].toFixed(6)}</small><br>
        <small>Lng: ${this.currentLocation[1].toFixed(6)}</small>
      `)
      .openPopup();
    
    console.log('✅ Marcador añadido en:', this.currentLocation);
  }

  // 🧭 Soluciona los errores 404 de los íconos de Leaflet
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

  // 🗺️ Inicializar el mapa Leaflet
  private initMap(): void {
    // Inicializar con ubicación por defecto
    const defaultLocation: [number, number] = [-41.4693, -72.9424];
    const initialLocation = this.currentLocation || defaultLocation;

    console.log('🗺️ Inicializando mapa en:', initialLocation);
    
    this.map = L.map('map', {
      center: initialLocation,
      zoom: this.currentLocation ? 17 : 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    if (this.currentLocation) {
      this.addCurrentLocationMarker();
    }
    
    setTimeout(() => {
      this.mostrarRutasEnMapa();
    }, 1000);
  }

  // 🎬 INICIAR GRABACIÓN DE RUTA CON GPS REAL
  async startRecording() {
    if (!this.currentUserId) {
      await this.showToast('⚠️ Debes iniciar sesión para grabar rutas', 'warning');
      return;
    }

    try {
      // Inicializar variables
      this.isRecording = true;
      this.recordedPoints = [];
      this.totalDistance = 0;
      this.startTime = Date.now();

      // 🌐 MODO WEB
      if (!this.platform.is('capacitor')) {
        console.log('🌐 Iniciando grabación en modo WEB');
        
        if (!navigator.geolocation) {
          throw new Error('Geolocation no disponible');
        }

        // Obtener posición inicial
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const startPoint = {
              latitud: position.coords.latitude,
              longitud: position.coords.longitude,
              timestamp: Date.now()
            };
            
            this.recordedPoints.push(startPoint);
            this.currentLocation = [startPoint.latitud, startPoint.longitud];

            console.log('🚩 Inicio de grabación GPS Web:', startPoint);

            // Marcador de inicio (verde)
            const greenIcon = this.createColoredIcon('green');
            this.startMarker = L.marker([startPoint.latitud, startPoint.longitud], { icon: greenIcon })
              .addTo(this.map)
              .bindPopup('<b>🚩 Inicio de tu ruta</b>')
              .openPopup();

            this.map.setView([startPoint.latitud, startPoint.longitud], 18);

            // Tracking continuo Web
            this.watchId = navigator.geolocation.watchPosition(
              (pos) => {
                if (this.isRecording) {
                  this.updateRecording(pos);
                }
              },
              (error) => console.error('❌ Error tracking Web:', error),
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              }
            ) as any;

            // Actualizar tiempo transcurrido
            this.recordingInterval = setInterval(() => {
              if (this.isRecording) {
                this.updateElapsedTime();
              }
            }, 1000);

            this.showToast('✅ Grabación iniciada. ¡Empieza a caminar!', 'success');
          },
          (error) => {
            console.error('❌ Error obteniendo posición inicial Web:', error);
            this.showToast('❌ Error al obtener ubicación inicial', 'danger');
            this.isRecording = false;
          }
        );

        return;
      }

      // 📱 MODO MÓVIL (Capacitor)
      console.log('📱 Iniciando grabación en modo MÓVIL');

      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          await this.showToast('❌ Permiso de GPS denegado', 'danger');
          this.isRecording = false;
          return;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });

      const startPoint = {
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        timestamp: Date.now()
      };
      
      this.recordedPoints.push(startPoint);
      this.currentLocation = [startPoint.latitud, startPoint.longitud];

      console.log('🚩 Inicio de grabación GPS Móvil:', startPoint);

      const greenIcon = this.createColoredIcon('green');
      this.startMarker = L.marker([startPoint.latitud, startPoint.longitud], { icon: greenIcon })
        .addTo(this.map)
        .bindPopup('<b>🚩 Inicio de tu ruta</b>')
        .openPopup();

      this.map.setView([startPoint.latitud, startPoint.longitud], 18);

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('❌ Error en GPS tracking:', err);
            return;
          }

          if (position && this.isRecording) {
            this.updateRecording(position);
          }
        }
      );

      this.recordingInterval = setInterval(() => {
        if (this.isRecording) {
          this.updateElapsedTime();
        }
      }, 1000);

      await this.showToast('✅ Grabación iniciada. ¡Empieza a caminar!', 'success');

    } catch (error) {
      console.error('❌ Error al iniciar grabación GPS:', error);
      await this.showToast('❌ Error al conectar con GPS', 'danger');
      this.isRecording = false;
    }
  }

  // 📍 Actualizar grabación con nuevo punto GPS
  private updateRecording(position: any) {
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
      this.map.setView([newPoint.latitud, newPoint.longitud], this.map.getZoom());

      console.log(`📍 Punto GPS #${this.recordedPoints.length} | ${this.totalDistance.toFixed(3)} km | ${this.currentSpeed.toFixed(1)} km/h`);
    }
  }

  // 🗺️ Actualizar la línea de la ruta en el mapa
  private updatePolyline() {
    const coords = this.recordedPoints.map(p => [p.latitud, p.longitud] as [number, number]);

    if (this.recordingPolyline) {
      this.map.removeLayer(this.recordingPolyline);
    }

    this.recordingPolyline = L.polyline(coords, {
      color: '#ff0000',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 5'
    }).addTo(this.map);
  }

  // 📍 Actualizar marcador de posición actual
  private updateCurrentMarker(lat: number, lng: number) {
    const blueIcon = this.createColoredIcon('blue');

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker([lat, lng], { icon: blueIcon })
      .addTo(this.map)
      .bindPopup(`<b>📍 Tu ubicación GPS</b><br>Velocidad: ${this.currentSpeed.toFixed(1)} km/h`);
  }

  // ⏱️ Actualizar tiempo transcurrido
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

  // ⏹️ DETENER GRABACIÓN DE RUTA
  async stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;

    // Detener watch de GPS
    if (this.watchId) {
      if (this.platform.is('capacitor')) {
        await Geolocation.clearWatch({ id: this.watchId });
      } else {
        navigator.geolocation.clearWatch(this.watchId as any);
      }
      this.watchId = null;
    }

    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    console.log(`🏁 Grabación finalizada. Puntos: ${this.recordedPoints.length}, Distancia: ${this.totalDistance.toFixed(2)} km`);

    if (this.recordedPoints.length > 1) {
      const lastPoint = this.recordedPoints[this.recordedPoints.length - 1];
      
      const redIcon = this.createColoredIcon('red');
      L.marker([lastPoint.latitud, lastPoint.longitud], { icon: redIcon })
        .addTo(this.map)
        .bindPopup('<b>🏁 Fin de tu ruta</b>')
        .openPopup();

      await this.showSaveDialog();
    } else {
      await this.showToast('⚠️ No se grabaron suficientes puntos GPS', 'warning');
      this.clearRecording();
    }
  }

  // 💾 Mostrar diálogo para guardar la ruta
  async showSaveDialog() {
    const alert = await this.alertController.create({
      header: '💾 Guardar Tu Ruta GPS',
      message: `
        <b>📏 Distancia:</b> ${this.totalDistance.toFixed(2)} km<br>
        <b>⏱️ Tiempo:</b> ${this.elapsedTime}<br>
        <b>📍 Puntos GPS:</b> ${this.recordedPoints.length}<br>
      `,
      inputs: [
        {
          name: 'nombre_ruta',
          type: 'text',
          placeholder: 'Ej: Ruta al Parque Accesible',
          attributes: {
            required: true,
            maxlength: 100
          }
        },
        {
          name: 'descripcion',
          type: 'textarea',
          placeholder: 'Describe tu ruta...'
        }
      ],
      buttons: [
        {
          text: '🗑️ Descartar',
          role: 'cancel',
          handler: () => {
            this.clearRecording();
          }
        },
        {
          text: '💾 Guardar',
          handler: (data) => {
            if (!data.nombre_ruta || data.nombre_ruta.trim() === '') {
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

  // 💾 Guardar ruta en la base de datos
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

    console.log('💾 Guardando ruta GPS:', rutaData);

    this.http.post(`${this.apiUrl}/rutas`, rutaData).subscribe({
      next: async (response: any) => {
        console.log('✅ Ruta guardada:', response);
        await this.showToast(`✅ Ruta "${nombre}" guardada`, 'success');
        this.clearRecording();
        this.cargarRutasGuardadas();
      },
      error: async (error) => {
        console.error('❌ Error al guardar:', error);
        await this.showToast('❌ Error al guardar la ruta', 'danger');
      }
    });
  }

  // 🧹 Limpiar datos de grabación
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

  // 📍 Cargar rutas guardadas desde el backend
  private cargarRutasGuardadas() {
    if (!this.currentUserId) return;

    this.http.get(`${this.apiUrl}/rutas/usuario/${this.currentUserId}`).subscribe({
      next: async (rutas: any) => {
        console.log(`📍 Rutas guardadas: ${rutas.length}`);
        
        if (rutas.length === 0) {
          this.rutasGuardadas = [];
          return;
        }

        this.rutasGuardadas = [];
        
        for (const ruta of rutas) {
          try {
            const rutaDetalle: any = await this.http.get(`${this.apiUrl}/rutas/${ruta.id_ruta}`).toPromise();
            this.rutasGuardadas.push(rutaDetalle);
          } catch (err) {
            console.error('Error cargando ruta:', err);
          }
        }

        if (this.map) {
          this.mostrarRutasEnMapa();
        }
      },
      error: (err) => console.error('Error cargando rutas:', err)
    });
  }

  // 🗺️ Mostrar todas las rutas guardadas en el mapa
  private mostrarRutasEnMapa() {
    this.rutasPolylines.forEach(p => this.map.removeLayer(p));
    this.rutasPolylines = [];

    if (this.rutasGuardadas.length === 0) {
      console.log('📍 No hay rutas para mostrar');
      return;
    }

    const colorPalette = ['#3880ff', '#10dc60', '#ffce00', '#f04141', '#7044ff', '#00d4ff'];

    this.rutasGuardadas.forEach((ruta, index) => {
      if (!ruta.coordenadas || ruta.coordenadas.length < 2) return;

      const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);
      const color = colorPalette[index % colorPalette.length];

      const polyline = L.polyline(coords, {
        color: color,
        weight: 4,
        opacity: 0.7
      }).addTo(this.map);

      this.rutasPolylines.push(polyline);

      const start = coords[0];
      const end = coords[coords.length - 1];

      const greenIcon = this.createColoredIcon('green');
      const redIcon = this.createColoredIcon('red');

      L.marker(start, { icon: greenIcon })
        .addTo(this.map)
        .bindPopup(`
          <b>🚩 ${ruta.nombre_ruta}</b><br>
          ${ruta.descripcion_ruta || ''}<br>
          <small>📏 ${ruta.longitud_ruta} km</small>
        `);

      L.marker(end, { icon: redIcon })
        .addTo(this.map)
        .bindPopup(`<b>🏁 ${ruta.nombre_ruta}</b>`);
    });

    console.log(`✅ ${this.rutasGuardadas.length} rutas mostradas`);
  }

  // 📜 Ver mis rutas guardadas
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

  // 📋 Mostrar lista de rutas con ActionSheet
  async showRutasActionSheet() {
    const buttons = this.rutasGuardadas.map(ruta => ({
      text: `${ruta.nombre_ruta} (${ruta.longitud_ruta} km)`,
      icon: 'navigate',
      handler: () => {
        this.cargarRutaEnMapa(ruta.id_ruta);
      }
    }));

    buttons.push(
      {
        text: '🔄 Recargar',
        icon: 'refresh',
        handler: () => {
          this.cargarRutasGuardadas();
        }
      } as any,
      {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel'
      } as any
    );

    const actionSheet = await this.actionSheetController.create({
      header: '📍 Mis Rutas GPS',
      subHeader: `${this.rutasGuardadas.length} ruta(s)`,
      buttons: buttons
    });

    await actionSheet.present();
  }

  // 🗺️ Cargar una ruta en el mapa
  async cargarRutaEnMapa(idRuta: number) {
    const ruta = this.rutasGuardadas.find(r => r.id_ruta === idRuta);
    if (!ruta) return;

    console.log('📍 Centrando en:', ruta.nombre_ruta);

    const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);
    
    const bounds = L.latLngBounds(coords);
    this.map.fitBounds(bounds, { padding: [50, 50] });

    const highlightPolyline = L.polyline(coords, {
      color: '#ffce00',
      weight: 6,
      opacity: 1.0
    }).addTo(this.map);

    setTimeout(() => {
      this.map.removeLayer(highlightPolyline);
    }, 3000);

    await this.showToast(`📍 ${ruta.nombre_ruta}`, 'primary');
  }

  // 📏 Calcular distancia entre dos puntos GPS
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

  // 🎨 Crear íconos de colores
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

  // 🍞 Mostrar toast
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // 📊 Calcular distancia total de todas las rutas
  calcularDistanciaTotal(): string {
    const total = this.rutasGuardadas.reduce((sum, ruta) => sum + (ruta.longitud_ruta || 0), 0);
    return total.toFixed(2);
  }
}