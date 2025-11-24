import * as L from 'leaflet';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class PublicarServicioPage implements OnInit, OnDestroy {

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
    if (usuario?.id) this.servicio.Empresas_id_empresa = usuario.id;

    this.cargarTiposDiscapacidad();
  }

  ionViewDidEnter() {
    this.fixLeafletIcons();

    setTimeout(() => {
      this.inicializarMapa(-33.4489, -70.6693);
    }, 300);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }

  private cargarTiposDiscapacidad() {
    const url = `http://${this.host}:3000/api/v1/discapacidades/tipos`;

    this.http.get(url).subscribe({
      next: (data: any) => {
        this.tiposDiscapacidad = data;
      },
      error: () => {
        this.mostrarToast("Error al cargar tipos de discapacidad", "danger");
      }
    });
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

  private inicializarMapa(lat: number, lng: number) {
    const contenedor = document.getElementById('map');

    if (!contenedor) {
      setTimeout(() => this.inicializarMapa(lat, lng), 200);
      return;
    }

    if (this.map) {
      this.map.off();
      this.map.remove();
    }

    this.map = L.map('map', {
      center: [lat, lng],
      zoom: 15,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng]).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 400);
  }

  obtenerUbicacion() {
    if (!navigator.geolocation) {
      this.mostrarToast("Tu navegador no soporta geolocalización.", "danger");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.servicio.latitud = lat;
        this.servicio.longitud = lng;

        this.map.setView([lat, lng], 16);
        this.marker.setLatLng([lat, lng]);

        this.mostrarToast("Ubicación obtenida.", "success");
      },
      () => this.mostrarToast("Error al obtener la ubicación.", "danger"),
      { enableHighAccuracy: true }
    );
  }

  private validarServicio(): string | null {
    if (!this.servicio.nombre_servicio.trim() || this.servicio.nombre_servicio.length < 3)
      return "El nombre debe tener mínimo 3 caracteres.";

    if (!this.servicio.descripcion_servicio.trim() || this.servicio.descripcion_servicio.length < 10)
      return "La descripción debe tener mínimo 10 caracteres.";

    if (!this.servicio.horario_disponible.trim())
      return "Debes indicar un horario disponible.";

    if (Number(this.servicio.costo_servicio) <= 0)
      return "El costo debe ser mayor a 0.";

    if (!this.servicio.direccion_lugar.trim())
      return "Debes ingresar una dirección.";

    if (!this.servicio.nombre_lugar.trim())
      return "Debes ingresar el nombre del lugar.";

    if (!this.servicio.id_discapacidad)
      return "Debes seleccionar un tipo de discapacidad.";

    if (!this.servicio.latitud || !this.servicio.longitud)
      return "Debes obtener la ubicación en el mapa.";

    return null;
  }

  registrarServicio() {
    const error = this.validarServicio();
    if (error) {
      this.mostrarToast("⚠️ " + error, "warning");
      return;
    }

    this.admEmpresaService.publicarServicio(this.servicio).subscribe({
      next: () => {
        this.mostrarToast("Servicio registrado correctamente.", "success");
        this.limpiarFormulario();

        if (this.map) {
          this.map.off();
          this.map.remove();
        }

        setTimeout(() => this.inicializarMapa(-33.4489, -70.6693), 200);
      },
      error: () => this.mostrarToast("Error al registrar el servicio.", "danger"),
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
  }

  async mostrarToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
    });
    toast.present();
  }
}
