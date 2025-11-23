import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RutasRecomendadasPage } from './rutas-recomendadas.page';

describe('RutasRecomendadasPage', () => {
  let component: RutasRecomendadasPage;
  let fixture: ComponentFixture<RutasRecomendadasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RutasRecomendadasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
