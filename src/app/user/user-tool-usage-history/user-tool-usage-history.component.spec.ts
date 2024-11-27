import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserToolUsageHistoryComponent } from './user-tool-usage-history.component';

describe('UserToolUsageHistoryComponent', () => {
  let component: UserToolUsageHistoryComponent;
  let fixture: ComponentFixture<UserToolUsageHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserToolUsageHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserToolUsageHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
