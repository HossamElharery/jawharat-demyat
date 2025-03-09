// add-task-sidebar.component.ts
import { Component, EventEmitter, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ChipModule } from 'primeng/chip';
import { FileUploadModule } from 'primeng/fileupload';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

type Mode = 'view' | 'edit' | 'add';

interface TaskModel {
  id?: number;
  title: string;
  projectId: string;
  priority: string;
  state: string;
  dueDate: Date;
  assignees: string[];
  description: string;
  attachments: File[];
  subTasks: SubTask[];
}

interface SubTask {
  title: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-add-task-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    ChipModule,
    FileUploadModule,
    TextareaModule,
    ToastModule
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './add-task-sidebar.component.html',
  styleUrls: ['./add-task-sidebar.component.scss']
})
export class AddTaskSidebarComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<TaskModel>();
  @ViewChild('sidebar') sidebar!: Sidebar;
  @ViewChild('fileUpload') fileUpload: any;

  taskForm!: FormGroup;
  visible = false;
  mode: Mode = 'add';
  maxFileSize = 10000000; // 10MB
  currentTask: TaskModel | null = null;

  // Header Info
  projectName: string = 'Project Name';
  createdDate: string = 'Mar 23, 10:34 PM';
  createdBy: string = 'Mohamed Ali';

  projects = [
    { label: 'Project A', value: 'a' },
    { label: 'Project B', value: 'b' },
    { label: 'Project C', value: 'c' }
  ];

  priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }
  ];

  states = [
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'inprogress' },
    { label: 'Done', value: 'done' }
  ];

  assigneesList = ['@mustafa', '@john', '@sarah'];
  selectedAssignees: string[] = [];

  subTaskList = [
    { title: 'Understanding Client brief', completed: true },
    { title: 'Research Competition', completed: true },
    { title: 'Define Target Audience', completed: false },
    { title: 'Create Wireframes', completed: false }
  ];

  attachmentsList = [
    { name: 'Task Attachment Details.pdf', size: '12 MB', type: 'application/pdf' },
    { name: 'Task Images.zip', size: '45 MB', type: 'application/zip' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      projectId: ['', Validators.required],
      priority: ['', Validators.required],
      state: ['', Validators.required],
      dueDate: [null, Validators.required],
      assignees: [[]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      attachments: [[]],
      subTasks: this.fb.array([])
    });
  }

  get subTasks(): FormArray {
    return this.taskForm.get('subTasks') as FormArray;
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get isAddMode(): boolean {
    return this.mode === 'add';
  }

  createSubTaskGroup(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      completed: [false]
    });
  }

  addSubTask(): void {
    this.subTasks.push(this.createSubTaskGroup());
  }

  removeSubTask(index: number): void {
    this.subTasks.removeAt(index);
  }

  handleClose() {
    this.closeSidebar();
  }

  openSidebar(taskData?: TaskModel, mode: Mode = 'add'): void {
    this.visible = true;
    this.mode = mode;
    this.currentTask = taskData || null;

    if (taskData && (mode === 'edit' || mode === 'view')) {
      const task = {
        ...taskData,
        dueDate: taskData.dueDate instanceof Date ? taskData.dueDate : new Date(taskData.dueDate)
      };
      this.taskForm.patchValue(task);
      this.selectedAssignees = task.assignees;

      while (this.subTasks.length) {
        this.subTasks.removeAt(0);
      }
      task.subTasks.forEach(subTask => {
        this.subTasks.push(this.fb.group(subTask));
      });
    } else {
      this.taskForm.reset();
      this.selectedAssignees = [];
      while (this.subTasks.length) {
        this.subTasks.removeAt(0);
      }
    }

    if (mode === 'view') {
      this.taskForm.disable();
    } else {
      this.taskForm.enable();
    }
  }

  closeSidebar(): void {
    this.visible = false;
    this.taskForm.reset();
    this.selectedAssignees = [];
    this.close.emit();
  }

  switchToEditMode(): void {
    this.mode = 'edit';
    this.taskForm.enable();
  }

  removeAssignee(assignee: string): void {
    this.selectedAssignees = this.selectedAssignees.filter(a => a !== assignee);
    this.taskForm.patchValue({ assignees: this.selectedAssignees });
  }

  addAssignee(assignee: string): void {
    if (!this.selectedAssignees.includes(assignee)) {
      this.selectedAssignees = [...this.selectedAssignees, assignee];
      this.taskForm.patchValue({ assignees: this.selectedAssignees });
    }
  }

  onUpload(event: any): void {
    const files = event.files;
    const currentAttachments = this.taskForm.get('attachments')?.value || [];

    files.forEach((file: File) => {
      if (file.size <= this.maxFileSize) {
        currentAttachments.push(file);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `File ${file.name} exceeds maximum size of 10MB`
        });
      }
    });

    this.taskForm.patchValue({ attachments: currentAttachments });
    this.fileUpload.clear();
  }

  removeAttachment(index: number): void {
    const attachments = this.taskForm.get('attachments')?.value || [];
    attachments.splice(index, 1);
    this.taskForm.patchValue({ attachments });
  }

  editTask() {
    this.switchToEditMode();
  }

  deleteTask() {
    // handle delete action
    console.log('Delete task');
  }

  downloadAttachment(file: any) {
    // handle download
    console.log('Downloading file:', file);
  }

  downloadAllAttachments() {
    // handle download all
    console.log('Downloading all attachments');
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formData = this.taskForm.value;
      this.saved.emit(formData);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Task ${this.isEditMode ? 'updated' : 'created'} successfully`
      });

      this.closeSidebar();
    } else {
      this.markFormGroupTouched(this.taskForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required fields correctly'
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.taskForm.get(fieldName);
    if (!control || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['minlength']) {
      return `Minimum length is ${errors['minlength'].requiredLength} characters`;
    }
    return 'Invalid input';
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      default: return '';
    }
  }

  getStateClass(state: string): string {
    switch (state.toLowerCase()) {
      case 'todo': return 'state-todo';
      case 'inprogress': return 'state-progress';
      case 'done': return 'state-done';
      default: return '';
    }
  }
}
