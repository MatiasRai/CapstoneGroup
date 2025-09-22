import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginAdmPage } from './login-adm.page';

describe('LoginAdmPage', () => {
  let component: LoginAdmPage;
  let fixture: ComponentFixture<LoginAdmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginAdmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
