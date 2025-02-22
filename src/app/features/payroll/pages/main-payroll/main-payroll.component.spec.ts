import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPayrollComponent } from './main-payroll.component';

describe('MainPayrollComponent', () => {
  let component: MainPayrollComponent;
  let fixture: ComponentFixture<MainPayrollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPayrollComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPayrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
