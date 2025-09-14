import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginEMPPage } from './login-emp.page';

describe('LoginEMPPage', () => {
  let component: LoginEMPPage;
  let fixture: ComponentFixture<LoginEMPPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginEMPPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
