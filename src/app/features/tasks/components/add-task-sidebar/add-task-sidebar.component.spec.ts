import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTaskSidebarComponent } from './add-task-sidebar.component';

describe('AddTaskSidebarComponent', () => {
  let component: AddTaskSidebarComponent;
  let fixture: ComponentFixture<AddTaskSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTaskSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTaskSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
