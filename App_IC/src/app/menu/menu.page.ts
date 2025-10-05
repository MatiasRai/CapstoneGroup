import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
import * as L from 'leaflet';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IONIC_IMPORTS]
})
export class MenuPage implements OnInit, AfterViewInit {
  searchText: string = '';
  selectedCategory: string = '';
  private map!: L.Map;

  // 📍 Datos de ejemplo con coordenadas [lat, lng]
  items: { name: string; category: string; coords: [number, number] }[] = [
    { name: 'Restaurante 1', category: 'restaurante', coords: [-41.4689, -72.9411] },
    { name: 'Agencia de Turismo 1', category: 'agencia_turismo', coords: [-41.4705, -72.9350] },
    { name: 'Transporte 1', category: 'transporte', coords: [-41.4720, -72.9480] },
    { name: 'Restaurante 2', category: 'restaurante', coords: [-41.4665, -72.9390] },
    { name: 'Agencia de Turismo 2', category: 'agencia_turismo', coords: [-41.4710, -72.9440] },
    { name: 'Transporte 2', category: 'transporte', coords: [-41.4690, -72.9370] }
  ];

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    this.initMap();
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

    // Asigna el ícono corregido globalmente
    L.Marker.prototype.options.icon = iconDefault;
  }

  // 🗺️ Inicializar el mapa Leaflet
  private initMap(): void {
    this.map = L.map('map', {
      center: [-41.4689, -72.9411],
      zoom: 13
    });

    // 🌍 Cargar los tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

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
      // Limpiar marcadores anteriores (manteniendo el tile base)
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) this.map.removeLayer(layer);
      });
      this.addMarkers(result);
    }

    return result;
  }

  // 📍 Agregar marcadores al mapa
  private addMarkers(data = this.items): void {
    data.forEach((item) => {
      const marker = L.marker(item.coords).addTo(this.map);
      marker.bindPopup(`<b>${item.name}</b><br>Categoría: ${item.category}`);
    });
  }
}
