import * as L from 'leaflet';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { AdmEmpresaService } from '../services/adm-empresa.service';
import { AuthService } from '../services/auth.service';
import { Geolocation } from '@capacitor/geolocation';

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

  constructor(
    private admEmpresaService: AdmEmpresaService,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const usuario = this.authService.getUser();
    if (usuario?.id) {
      this.servicio.Empresas_id_empresa = usuario.id;
    }
  }

  ngAfterViewInit() {
    // Inicializar mapa vacío (por defecto en Santiago si no hay ubicación)
    this.inicializarMapa(-33.4489, -70.6693);
  }

  // 🗺️ Inicializa el mapa
  private inicializarMapa(lat: number, lng: number) {
    if (this.map) {
      this.map.remove(); // elimina instancia previa si existe
    }

    this.map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Marcador inicial
    this.marker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup('📍 Ubicación actual o predeterminada')
      .openPopup();
  }

  // 📍 Obtener ubicación actual del dispositivo
  async obtenerUbicacion() {
    try {
      const permiso = await Geolocation.requestPermissions();
      if (permiso.location === 'denied') {
        this.mostrarToast('Permiso de ubicación denegado.', 'danger');
        return;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.servicio.latitud = lat;
      this.servicio.longitud = lng;
      this.ubicacionObtenida = true;

      console.log('📍 Ubicación capturada:', lat, lng);

      this.mostrarToast('Ubicación obtenida correctamente.', 'success');

      // Actualiza el mapa y el marcador
      this.map.setView([lat, lng], 16);
      this.marker.setLatLng([lat, lng]).bindPopup('📍 Aquí se ubicará tu servicio').openPopup();
    } catch (error) {
      console.error('❌ Error al obtener ubicación:', error);
      this.mostrarToast('No se pudo obtener la ubicación.', 'danger');
    }
  }

  // 📤 Enviar el servicio al backend
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
        // Reposicionar mapa
        if (this.map) this.map.remove();
        this.inicializarMapa(-33.4489, -70.6693);
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

  // 🧃 Mostrar mensaje Toast
  async mostrarToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }
}
