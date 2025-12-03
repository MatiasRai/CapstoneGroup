import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuBlindPage } from './menu-blind.page';

describe('MenuBlindPage', () => {
  let component: MenuBlindPage;
  let fixture: ComponentFixture<MenuBlindPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuBlindPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
