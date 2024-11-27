import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsLocationComponent } from './tools-location.component';

describe('ToolsLocationComponent', () => {
  let component: ToolsLocationComponent;
  let fixture: ComponentFixture<ToolsLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsLocationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
