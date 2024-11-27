import { TestBed } from '@angular/core/testing';

import { PatternLockService } from './pattern-lock.service';

describe('PatternLockService', () => {
  let service: PatternLockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatternLockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
