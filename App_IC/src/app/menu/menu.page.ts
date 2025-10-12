import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IONIC_IMPORTS]
})
export class MenuPage implements OnInit, AfterViewInit {
  form!: FormGroup;
  private map!: L.Map;
  private polyline!: L.Polyline;
  coordenadas: { lat: number; lng: number }[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre_ruta: [''],
      descripcion_ruta: ['']
    });
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    this.initMap();
  }

  // 🔧 Corrige los íconos de Leaflet
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

  // 🗺️ Inicializar mapa y eventos de clic
  private initMap(): void {
    this.map = L.map('map', {
      center: [-41.4689, -72.9411],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.polyline = L.polyline([], { color: 'blue' }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const punto = { lat: e.latlng.lat, lng: e.latlng.lng };
      this.coordenadas.push(punto);
      this.polyline.addLatLng(e.latlng);
    });
  }

  // 📤 Enviar ruta al backend
  registrarRuta(): void {
    const data = {
      ...this.form.value,
      id_tipo_ruta: 1, // Ajusta según tu lógica de tipos
      id_usuario: 2,   // Reemplaza con el usuario real (si tienes login)
      coordenadas: this.coordenadas
    };

    this.http.post('http://localhost:3000/api/v1/rutas', data).subscribe({
      next: (res) => {
        alert('Ruta registrada con éxito');
        this.form.reset();
        this.coordenadas = [];
        this.polyline.setLatLngs([]);
      },
      error: (err) => {
        console.error('Error al registrar ruta', err);
        alert('Error al registrar la ruta');
      }
    });
  }
}
