import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { Platform, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { AppLauncher } from '@capacitor/app-launcher';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, IONIC_IMPORTS]
})
export class MenuPage implements OnInit, AfterViewInit, OnDestroy {
  searchText: string = '';
  selectedCategory: string = '';
  private map!: L.Map;
  private currentLocation: [number, number] = [-41.4689, -72.9411];
  private markers: L.Marker[] = [];
  private currentUserId: number | null = null;
  private apiUrl = 'http://localhost:3000/api/v1';
  
  // 🎯 Variables para tracking de ruta en tiempo real
  isRecording: boolean = false;
  recordedPoints: { latitud: number; longitud: number; timestamp: number }[] = [];
  recordingPolyline: L.Polyline | null = null;
  startMarker: L.Marker | null = null;
  currentMarker: L.Marker | null = null;
  watchId: string | null = null;
  totalDistance: number = 0; // en kilómetros
  startTime: number = 0;
  recordingInterval: any = null;
  
  // 📊 Estadísticas en vivo
  currentSpeed: number = 0; // km/h
  elapsedTime: string = '00:00:00';
  
  // 📍 Datos de lugares de interés
  items: { 
    id: number;
    name: string; 
    category: string; 
    coords: [number, number];
    address?: string;
  }[] = [
    { 
      id: 1,
      name: 'Restaurante El Fogón', 
      category: 'restaurante', 
      coords: [-41.4689, -72.9411],
      address: 'Antonio Varas 447, Puerto Montt'
    },
    { 
      id: 2,
      name: 'Turismo Patagonia', 
      category: 'agencia_turismo', 
      coords: [-41.4705, -72.9350],
      address: 'Diego Portales 506, Puerto Montt'
    },
    { 
      id: 3,
      name: 'Transfer Express', 
      category: 'transporte', 
      coords: [-41.4720, -72.9480],
      address: 'Benavente 970, Puerto Montt'
    },
    { 
      id: 4,
      name: 'Restaurante Vista al Mar', 
      category: 'restaurante', 
      coords: [-41.4665, -72.9390],
      address: 'Costanera 250, Puerto Montt'
    },
    { 
      id: 5,
      name: 'Aventura Sur Turismo', 
      category: 'agencia_turismo', 
      coords: [-41.4710, -72.9440],
      address: 'San Martín 200, Puerto Montt'
    },
    { 
      id: 6,
      name: 'Buses Lago Verde', 
      category: 'transporte', 
      coords: [-41.4690, -72.9370],
      address: 'Urmeneta 330, Puerto Montt'
    }
  ];

  constructor(
    private platform: Platform,
    private http: HttpClient,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.getCurrentPosition();
    this.loadCurrentUser();
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    this.initMap();
  }

  ngOnDestroy() {
    // Limpiar watchers al destruir el componente
    this.stopRecording();
  }

  // 👤 Cargar usuario actual desde localStorage
  private loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
      console.log('✅ Usuario cargado:', this.currentUserId);
    } else {
      console.warn('⚠️ No hay usuario logueado');
    }
  }

  // 📍 Obtener ubicación actual del dispositivo
  async getCurrentPosition() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.currentLocation = [
        coordinates.coords.latitude,
        coordinates.coords.longitude
      ];
      console.log('📍 Ubicación actual:', this.currentLocation);
      
      if (this.map) {
        this.map.setView(this.currentLocation, 15);
        this.addCurrentLocationMarker();
      }
    } catch (error) {
      console.log('⚠️ No se pudo obtener la ubicación, usando ubicación por defecto');
      this.showToast('⚠️ No se pudo obtener tu ubicación GPS', 'warning');
    }
  }

  // 🧭 Añadir marcador de ubicación actual
  private addCurrentLocationMarker(): void {
    const blueIcon = L.icon({
      iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Remover marcador anterior si existe
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker(this.currentLocation, { icon: blueIcon })
      .addTo(this.map)
      .bindPopup('<b>📍 Tu ubicación actual</b>');
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

  // 🗺️ Inicializar el mapa Leaflet con OpenStreetMap
  private initMap(): void {
    this.map = L.map('map', {
      center: this.currentLocation,
      zoom: 15
    });

    // 🌍 Cargar los tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.addCurrentLocationMarker();
    this.addMarkers();
  }

  // 🔎 Filtrar elementos y actualizar el mapa
  filteredItems() {
    const result = this.items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesCategory = this.selectedCategory ? item.category === this.selectedCategory : true;
      return matchesSearch && matchesCategory;
    });

    if (this.map) {
      this.markers.forEach(marker => this.map.removeLayer(marker));
      this.markers = [];
      this.addMarkers(result);
    }

    return result;
  }

  // 📍 Agregar marcadores de lugares al mapa
  private addMarkers(data = this.items): void {
    data.forEach((item) => {
      const marker = L.marker(item.coords).addTo(this.map);
      this.markers.push(marker);
      
      const popupContent = `
        <div style="text-align: center;">
          <b>${item.name}</b><br>
          <small>Categoría: ${item.category}</small><br>
          <small>${item.address || ''}</small><br><br>
          <button onclick="window.dispatchEvent(new CustomEvent('openInMaps', {detail: {coords: [${item.coords}], name: '${item.name}'}}))"
                  style="background: #2dd36f; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 2px;">
            🗺️ Abrir en Maps
          </button>
        </div>
      `;
      
      marker.bindPopup(popupContent);
    });

    window.addEventListener('openInMaps', (event: any) => {
      this.openInNativeMaps(event.detail.coords, event.detail.name);
    });
  }

  // 📱 Abrir en aplicación nativa de mapas
  async openInNativeMaps(destination: [number, number], destName: string) {
    const lat = destination[0];
    const lng = destination[1];

    if (this.platform.is('android')) {
      const googleMapsUrl = `geo:0,0?q=${lat},${lng}(${encodeURIComponent(destName)})`;
      try {
        await AppLauncher.openUrl({ url: googleMapsUrl });
      } catch (error) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_system');
      }
    } else if (this.platform.is('ios')) {
      const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
      window.open(appleMapsUrl, '_system');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  }

  // 🎬 INICIAR GRABACIÓN DE RUTA
  async startRecording() {
    if (!this.currentUserId) {
      await this.showToast('⚠️ Debes iniciar sesión para grabar rutas', 'warning');
      return;
    }

    // Solicitar permiso de ubicación
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          await this.showToast('❌ Permiso de ubicación denegado', 'danger');
          return;
        }
      }

      // Inicializar variables
      this.isRecording = true;
      this.recordedPoints = [];
      this.totalDistance = 0;
      this.startTime = Date.now();

      // Obtener posición inicial
      const position = await Geolocation.getCurrentPosition();
      const startPoint = {
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        timestamp: Date.now()
      };
      
      this.recordedPoints.push(startPoint);
      this.currentLocation = [startPoint.latitud, startPoint.longitud];

      // Marcador de inicio (verde)
      const greenIcon = L.icon({
        iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      this.startMarker = L.marker([startPoint.latitud, startPoint.longitud], { icon: greenIcon })
        .addTo(this.map)
        .bindPopup('<b>🚩 Inicio de ruta</b>')
        .openPopup();

      // Centrar mapa en posición inicial
      this.map.setView([startPoint.latitud, startPoint.longitud], 17);

      // Iniciar tracking GPS continuo (cada 3 segundos)
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('Error en GPS:', err);
            return;
          }

          if (position && this.isRecording) {
            this.updateRecording(position);
          }
        }
      );

      // Actualizar tiempo transcurrido cada segundo
      this.recordingInterval = setInterval(() => {
        if (this.isRecording) {
          this.updateElapsedTime();
        }
      }, 1000);

      await this.showToast('✅ Grabación iniciada. ¡Empieza a caminar!', 'success');

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      await this.showToast('❌ Error al iniciar grabación', 'danger');
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

    // Solo agregar si el punto es diferente al anterior (movimiento mínimo 5 metros)
    const lastPoint = this.recordedPoints[this.recordedPoints.length - 1];
    const distance = this.calculateDistance(
      lastPoint.latitud,
      lastPoint.longitud,
      newPoint.latitud,
      newPoint.longitud
    );

    if (distance > 0.005) { // > 5 metros
      this.recordedPoints.push(newPoint);
      
      // Calcular distancia total
      this.totalDistance += distance;

      // Calcular velocidad (km/h)
      const timeDiff = (newPoint.timestamp - lastPoint.timestamp) / 1000; // segundos
      if (timeDiff > 0) {
        this.currentSpeed = (distance / timeDiff) * 3600; // convertir a km/h
      }

      // Actualizar línea en el mapa
      this.updatePolyline();

      // Mover marcador de posición actual
      this.updateCurrentMarker(newPoint.latitud, newPoint.longitud);

      // Centrar mapa en posición actual
      this.map.setView([newPoint.latitud, newPoint.longitud], this.map.getZoom());

      console.log(`📍 Punto grabado: ${this.recordedPoints.length} | Distancia: ${this.totalDistance.toFixed(2)} km`);
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
      weight: 4,
      opacity: 0.8
    }).addTo(this.map);
  }

  // 📍 Actualizar marcador de posición actual
  private updateCurrentMarker(lat: number, lng: number) {
    const blueIcon = L.icon({
      iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker([lat, lng], { icon: blueIcon })
      .addTo(this.map)
      .bindPopup('<b>📍 Tu ubicación</b>');
  }

  // ⏱️ Actualizar tiempo transcurrido
  private updateElapsedTime() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000); // segundos
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
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }

    // Detener intervalo de tiempo
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    // Agregar marcador de fin (rojo)
    if (this.recordedPoints.length > 0) {
      const lastPoint = this.recordedPoints[this.recordedPoints.length - 1];
      
      const redIcon = L.icon({
        iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker([lastPoint.latitud, lastPoint.longitud], { icon: redIcon })
        .addTo(this.map)
        .bindPopup('<b>🏁 Fin de ruta</b>')
        .openPopup();

      // Mostrar diálogo para guardar
      await this.showSaveDialog();
    } else {
      await this.showToast('⚠️ No se grabaron suficientes puntos', 'warning');
    }
  }

  // 💾 Mostrar diálogo para guardar la ruta
  async showSaveDialog() {
    const alert = await this.alertController.create({
      header: '💾 Guardar Ruta',
      message: `
        <b>📏 Distancia:</b> ${this.totalDistance.toFixed(2)} km<br>
        <b>⏱️ Tiempo:</b> ${this.elapsedTime}<br>
        <b>📍 Puntos grabados:</b> ${this.recordedPoints.length}<br><br>
        Dale un nombre a tu ruta para compartirla con otros usuarios
      `,
      inputs: [
        {
          name: 'nombre_ruta',
          type: 'text',
          placeholder: 'Ej: Ruta al Museo Accesible',
          attributes: {
            required: true
          }
        },
        {
          name: 'descripcion',
          type: 'textarea',
          placeholder: 'Describe tu ruta: accesibilidad, puntos de interés, recomendaciones...'
        }
      ],
      buttons: [
        {
          text: 'Descartar',
          role: 'cancel',
          handler: () => {
            this.clearRecording();
          }
        },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.nombre_ruta || data.nombre_ruta.trim() === '') {
              this.showToast('⚠️ Debes ingresar un nombre para la ruta', 'warning');
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
      id_tipo_ruta: 1, // Ruta peatonal
      id_usuario: this.currentUserId,
      longitud_ruta: parseFloat(this.totalDistance.toFixed(2)),
      coordenadas: this.recordedPoints.map(p => ({
        latitud: p.latitud,
        longitud: p.longitud
      }))
    };

    this.http.post(`${this.apiUrl}/rutas`, rutaData).subscribe({
      next: async (response: any) => {
        console.log('✅ Ruta guardada:', response);
        await this.showToast(`✅ Ruta "${nombre}" guardada exitosamente`, 'success');
        this.clearRecording();
      },
      error: async (error) => {
        console.error('❌ Error al guardar ruta:', error);
        await this.showToast('❌ Error al guardar la ruta. Intenta nuevamente.', 'danger');
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

  // 📜 Ver mis rutas guardadas
  async verMisRutas() {
    if (!this.currentUserId) {
      await this.showToast('⚠️ Debes iniciar sesión', 'warning');
      return;
    }

    this.http.get(`${this.apiUrl}/rutas/usuario/${this.currentUserId}`).subscribe({
      next: async (rutas: any) => {
        console.log('📍 Rutas del usuario:', rutas);
        if (rutas.length === 0) {
          await this.showToast('📍 Aún no tienes rutas guardadas. ¡Crea tu primera ruta!', 'primary');
        } else {
          await this.showRutasActionSheet(rutas);
        }
      },
      error: async (error) => {
        console.error('❌ Error al obtener rutas:', error);
        await this.showToast('❌ Error al cargar rutas', 'danger');
      }
    });
  }

  // 📋 Mostrar lista de rutas con ActionSheet
  async showRutasActionSheet(rutas: any[]) {
    const buttons = rutas.map(ruta => ({
      text: `${ruta.nombre_ruta} (${ruta.longitud_ruta} km)`,
      handler: () => {
        this.cargarRutaEnMapa(ruta.id_ruta);
      }
    }));

    buttons.push({
      text: 'Cancelar',
      role: 'cancel'
    } as any);

    const actionSheet = await this.actionSheetController.create({
      header: '📍 Mis Rutas Guardadas',
      subHeader: `Tienes ${rutas.length} ruta(s)`,
      buttons: buttons
    });

    await actionSheet.present();
  }

  // 🗺️ Cargar una ruta guardada en el mapa
  async cargarRutaEnMapa(idRuta: number) {
    this.http.get(`${this.apiUrl}/rutas/${idRuta}`).subscribe({
      next: async (ruta: any) => {
        console.log('📍 Ruta cargada:', ruta);
        
        // Limpiar ruta anterior
        this.clearRecording();

        // Dibujar la ruta
        const coords = ruta.coordenadas.map((c: any) => [c.latitud, c.longitud] as [number, number]);
        
        this.recordingPolyline = L.polyline(coords, {
          color: '#3880ff',
          weight: 5,
          opacity: 0.7
        }).addTo(this.map);

        // Marcadores de inicio y fin
        if (coords.length > 0) {
          const start = coords[0];
          const end = coords[coords.length - 1];
          
          const greenIcon = L.icon({
            iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          const redIcon = L.icon({
            iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          
          L.marker(start, { icon: greenIcon })
            .addTo(this.map)
            .bindPopup(`<b>🚩 Inicio:</b> ${ruta.nombre_ruta}`);
          
          L.marker(end, { icon: redIcon })
            .addTo(this.map)
            .bindPopup(`<b>🏁 Fin:</b> ${ruta.nombre_ruta}<br><small>${ruta.descripcion_ruta || ''}</small>`);
        }

        // Centrar mapa en la ruta
        this.map.fitBounds(this.recordingPolyline.getBounds());

        await this.showToast(`✅ Ruta cargada: ${ruta.nombre_ruta}`, 'success');
      },
      error: async (error) => {
        console.error('❌ Error al cargar ruta:', error);
        await this.showToast('❌ Error al cargar la ruta', 'danger');
      }
    });
  }

  // 📏 Calcular distancia entre dos puntos (fórmula Haversine)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
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
}