import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RutaDetallePage } from './ruta-detalle.page';

describe('RutaDetallePage', () => {
  let component: RutaDetallePage;
  let fixture: ComponentFixture<RutaDetallePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RutaDetallePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
