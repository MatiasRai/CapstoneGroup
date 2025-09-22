import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroAdmEmpresaPage } from './registro-adm-empresa.page';

describe('RegistroAdmEmpresaPage', () => {
  let component: RegistroAdmEmpresaPage;
  let fixture: ComponentFixture<RegistroAdmEmpresaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroAdmEmpresaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
