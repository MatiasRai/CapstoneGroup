import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroEmpresaPage } from './registro-empresa.page';

describe('RegistroEmpresaPage', () => {
  let component: RegistroEmpresaPage;
  let fixture: ComponentFixture<RegistroEmpresaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroEmpresaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
