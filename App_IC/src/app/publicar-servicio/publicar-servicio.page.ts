import * as L from 'leaflet';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from '../services/adm-empresa.service';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-publicar-servicio',
  templateUrl: './publicar-servicio.page.html',
  styleUrls: ['./publicar-servicio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ...IONIC_IMPORTS],
})
export class PublicarServicioPage implements OnInit, AfterViewInit {
  servicio = {
    nombre_servicio: '',
    descripcion_servicio: '',
    horario_disponible: '',
    costo_servicio: '',
    direccion_lugar: '',
    Empresas_id_empresa: null as number | null,
    id_discapacidad: null as number | null,
    nombre_lugar: '',
    latitud: null as number | null,
    longitud: null as number | null,
    id_categoria: 1,
  };

  private map!: L.Map;
  private marker!: L.Marker;
  ubicacionObtenida = false;

  tiposDiscapacidad: any[] = [];
  private host = window.location.hostname;

  constructor(
    private admEmpresaService: AdmEmpresaService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const usuario = this.authService.getUser();
    if (usuario?.id) {
      this.servicio.Empresas_id_empresa = usuario.id;
    }
    
    this.cargarTiposDiscapacidad();
  }

  ngAfterViewInit() {
    // 🧭 Arreglar íconos de Leaflet ANTES de inicializar el mapa
    this.fixLeafletIcons();
    
    // ⏱️ Esperar un poco antes de inicializar el mapa
    setTimeout(() => {
      this.inicializarMapa(-33.4489, -70.6693);
    }, 100);
  }

  // 🧭 Fix íconos de Leaflet (cargar desde CDN)
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

  cargarTiposDiscapacidad() {
    const url = `http://${this.host}:3000/api/v1/discapacidades/tipos`;
    
    this.http.get(url).subscribe({
      next: (data: any) => {
        this.tiposDiscapacidad = data;
        console.log('✅ Tipos de discapacidad cargados:', this.tiposDiscapacidad);
      },
      error: (err) => {
        console.error('❌ Error al cargar tipos de discapacidad:', err);
        this.mostrarToast('Error al cargar tipos de discapacidad', 'danger');
      }
    });
  }

  // 🗺️ INICIALIZAR MAPA CON ANIMACIONES (igual que menu.page.ts)
  private inicializarMapa(lat: number, lng: number) {
    if (this.map) {
      this.map.remove();
    }

    // ✅ Crear mapa CON animaciones activadas
    this.map = L.map('map', {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      preferCanvas: false,
      zoomAnimation: true,           // ✅ Activar animación de zoom
      fadeAnimation: true,            // ✅ Activar animación de fade
      markerZoomAnimation: true,      // ✅ Activar animación de marcadores
      trackResize: true               // ✅ Seguir cambios de tamaño
    });

    // ✅ Configurar tiles CON gestión de errores
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 10,
      keepBuffer: 4,                  // ✅ Mantener tiles en buffer
      updateWhenIdle: false,          // ✅ Actualizar mientras se mueve
      updateWhenZooming: false,       // ✅ No actualizar durante zoom
      updateInterval: 200,            // ✅ Intervalo de actualización
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      crossOrigin: true,
      opacity: 1.0,
      className: 'map-tiles'
    });

    tileLayer.addTo(this.map);

    // ✅ Manejar errores de tiles
    tileLayer.on('tileerror', (error: any) => {
      console.warn('⚠️ Error cargando tile, intentando recargar...');
    });

    tileLayer.on('load', () => {
      console.log('✅ Tiles del mapa cargadas');
    });

    // ✅ Redimensionar mapa después de inicializar
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        console.log('🗺️ Mapa redimensionado correctamente');
      }
    }, 200);

    // ✅ Crear marcador inicial
    this.marker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup('📍 Ubicación actual o predeterminada')
      .openPopup();

    console.log('🗺️ Mapa inicializado con animaciones activadas');
  }

  async obtenerUbicacion() {
    try {
      console.log('🔍 Solicitando ubicación GPS...');

      if (!navigator.geolocation) {
        console.error('❌ Geolocation no disponible');
        this.mostrarToast('⚠️ Tu navegador no soporta geolocalización', 'danger');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.servicio.latitud = lat;
          this.servicio.longitud = lng;
          this.ubicacionObtenida = true;

          console.log('✅ GPS obtenido:', { lat, lng });
          console.log('📊 Precisión:', position.coords.accuracy, 'metros');
          console.log('✅ Servicio actualizado:', this.servicio);

          this.mostrarToast('Ubicación obtenida correctamente.', 'success');

          // ✅ Actualizar mapa CON animación
          this.map.setView([lat, lng], 16, {
            animate: true,
            duration: 0.5
          });

          this.marker.setLatLng([lat, lng])
            .bindPopup('📍 Aquí se ubicará tu servicio')
            .openPopup();
        },
        (error) => {
          console.error('❌ Error GPS:', error);
          let mensaje = 'No se pudo obtener la ubicación';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              mensaje = 'Permiso de ubicación denegado';
              break;
            case error.POSITION_UNAVAILABLE:
              mensaje = 'Ubicación no disponible';
              break;
            case error.TIMEOUT:
              mensaje = 'Tiempo de espera agotado';
              break;
          }
          
          this.mostrarToast(mensaje, 'danger');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );

    } catch (error: any) {
      console.error('❌ Error al obtener GPS:', error);
      this.mostrarToast(`⚠️ Error GPS: ${error.message}`, 'warning');
    }
  }

  registrarServicio() {
    console.log('📤 Enviando servicio:', this.servicio);

    if (!this.servicio.nombre_servicio || !this.servicio.descripcion_servicio) {
      this.mostrarToast('Completa todos los campos obligatorios.', 'warning');
      return;
    }

    this.admEmpresaService.publicarServicio(this.servicio).subscribe({
      next: (res) => {
        console.log('✅ Servicio registrado:', res);
        this.mostrarToast('Servicio registrado correctamente.', 'success');
        this.limpiarFormulario();
        
        // ✅ Reinicializar mapa con pequeño delay
        if (this.map) {
          this.map.remove();
        }
        setTimeout(() => {
          this.inicializarMapa(-33.4489, -70.6693);
        }, 100);
      },
      error: (err) => {
        console.error('❌ Error al registrar servicio:', err);
        this.mostrarToast('Error al registrar el servicio.', 'danger');
      },
    });
  }

  limpiarFormulario() {
    const empresaId = this.authService.getUser()?.id || null;

    this.servicio = {
      nombre_servicio: '',
      descripcion_servicio: '',
      horario_disponible: '',
      costo_servicio: '',
      direccion_lugar: '',
      Empresas_id_empresa: empresaId,
      id_discapacidad: null,
      nombre_lugar: '',
      latitud: null,
      longitud: null,
      id_categoria: 1,
    };

    this.ubicacionObtenida = false;
  }

  async mostrarToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }
}