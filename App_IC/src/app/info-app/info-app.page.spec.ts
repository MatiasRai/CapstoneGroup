import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoAppPage } from './info-app.page';

describe('InfoAppPage', () => {
  let component: InfoAppPage;
  let fixture: ComponentFixture<InfoAppPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoAppPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
