import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainInternalComponent } from './main-internal.component';

describe('MainInternalComponent', () => {
  let component: MainInternalComponent;
  let fixture: ComponentFixture<MainInternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainInternalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainInternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
