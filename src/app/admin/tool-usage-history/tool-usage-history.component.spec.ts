import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolUsageHistoryComponent } from './tool-usage-history.component';

describe('ToolUsageHistoryComponent', () => {
  let component: ToolUsageHistoryComponent;
  let fixture: ComponentFixture<ToolUsageHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolUsageHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolUsageHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
