import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollViewComponent } from './payroll-view.component';

describe('PayrollViewComponent', () => {
  let component: PayrollViewComponent;
  let fixture: ComponentFixture<PayrollViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
