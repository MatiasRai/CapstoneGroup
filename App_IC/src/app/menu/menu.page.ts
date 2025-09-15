import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IONIC_IMPORTS } from 'src/shared/ionic-imports';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IONIC_IMPORTS]
})
export class MenuPage implements OnInit {

  constructor() { }
  searchText: string = '';
  selectedCategory: string = '';
  items = [
    { name: 'Restaurante 1', category: 'restaurante' },
    { name: 'Agencia de Turismo 1', category: 'agencia_turismo' },
    { name: 'Transporte 1', category: 'transporte' },
    { name: 'Restaurante 2', category: 'restaurante' },
    { name: 'Agencia de Turismo 2', category: 'agencia_turismo' },
    { name: 'Transporte 2', category: 'transporte' },
  ];
  ngOnInit() {
  }

  filteredItems() {
    return this.items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesCategory = this.selectedCategory ? item.category === this.selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }

}
