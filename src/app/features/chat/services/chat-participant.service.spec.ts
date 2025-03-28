import { TestBed } from '@angular/core/testing';

import { ChatParticipantService } from './chat-participant.service';

describe('ChatParticipantService', () => {
  let service: ChatParticipantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatParticipantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
