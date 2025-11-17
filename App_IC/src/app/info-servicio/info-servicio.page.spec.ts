import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoServicioPage } from './info-servicio.page';

describe('InfoServicioPage', () => {
  let component: InfoServicioPage;
  let fixture: ComponentFixture<InfoServicioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoServicioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
