import { TestBed } from '@angular/core/testing';

import { AdmEmpresaService  } from './adm-empresa.service';

describe('AdmEmpresa', () => {
  let service: AdmEmpresaService ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdmEmpresaService );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
