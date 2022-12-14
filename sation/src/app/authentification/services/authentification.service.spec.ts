import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { AuthentificationService } from './authentification.service';

describe('AuthentificationService', () => {
  let service: AuthentificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [AuthentificationService]
    });
    service = TestBed.inject(AuthentificationService);
  });

  it('сервис создается', () => {
    expect(service).toBeTruthy();
  });
});
