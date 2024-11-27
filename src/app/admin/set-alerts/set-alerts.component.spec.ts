import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetAlertsComponent } from './set-alerts.component';

describe('SetAlertsComponent', () => {
  let component: SetAlertsComponent;
  let fixture: ComponentFixture<SetAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
