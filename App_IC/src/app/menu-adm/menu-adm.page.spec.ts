import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuADMPage } from './menu-adm.page';

describe('MenuADMPage', () => {
  let component: MenuADMPage;
  let fixture: ComponentFixture<MenuADMPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuADMPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
