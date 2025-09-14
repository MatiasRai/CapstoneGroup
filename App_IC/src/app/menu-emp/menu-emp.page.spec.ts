import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuEMPPage } from './menu-emp.page';

describe('MenuEMPPage', () => {
  let component: MenuEMPPage;
  let fixture: ComponentFixture<MenuEMPPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuEMPPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
