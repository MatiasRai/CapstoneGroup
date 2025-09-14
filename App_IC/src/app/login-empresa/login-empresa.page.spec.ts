import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginEmpresaPage } from './login-empresa.page';

describe('LoginEmpresaPage', () => {
  let component: LoginEmpresaPage;
  let fixture: ComponentFixture<LoginEmpresaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginEmpresaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
