import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicarServicioPage } from './publicar-servicio.page';

describe('PublicarServicioPage', () => {
  let component: PublicarServicioPage;
  let fixture: ComponentFixture<PublicarServicioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicarServicioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
