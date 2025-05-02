import { Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip'; // Add TooltipModule import
import { Task, TasksService } from '../../services/tasks.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { UsersService } from '../../../../features/users/services/users.service';
import { ProjectsService } from '../../../projects/services/projects.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export type Mode = 'view' | 'edit' | 'add';

export interface SubTask {
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
    FormsModule,
    SidebarModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    MultiSelectModule,
    FileUploadModule,
    TextareaModule,
    ToastModule,
    TabsModule,
    TranslateModule,
    TooltipModule // Add TooltipModule to the imports array
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './add-task-sidebar.component.html',
  styleUrls: ['./add-task-sidebar.component.scss']
})
export class AddTaskSidebarComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  @ViewChild('sidebar') sidebar!: Sidebar;
  @ViewChild('fileUpload') fileUpload: any;

  taskForm!: FormGroup;
  visible = false;
  mode: Mode = 'add';
  maxFileSize = 10000000; // 10MB
  currentTask: Task | any = null;
  isLoading = false;
  taskId: string | null = null;

  // Header Info
  projectName: string = 'Project Name';
  createdDate: string = new Date().toLocaleString();
  createdBy: string = 'User';

  // Dropdown options
  projects: any[] = [];
  priorities = [
    { label: '', value: 'low' },
    { label: '', value: 'medium' },
    { label: '', value: 'high' }
  ];
  states = [
    { label: '', value: 'todo' },
    { label: '', value: 'inprogress' },
    { label: '', value: 'completed' }
  ];

  // Tabs
  activeTab: string = 'subtasks';

  // Users and assignees
  users: any[] = [];
  assigneeOptions: any[] = [];
  selectedAssignees: any[] = [];

  // Comments
  commentContent: string = '';
  submittingComment: boolean = false;
  comments: any[] = [];

  // Attachments
  uploadedFiles: File[] = [];
  attachmentsList: any[] = [];

  constructor(
    private fb: FormBuilder,
    public tasksService: TasksService,
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private toastService: ToastService,
    private translateService: TranslateService
  ) {
    this.initForm();
    this.updateDropdownTranslations();
  }

  ngOnInit() {
    // Load users for assignee dropdown
    this.loadUsers();
    // Load projects
    this.loadProjects();

    // Update dropdown labels when language changes
    this.translateService.onLangChange.subscribe(() => {
      this.updateDropdownTranslations();
    });
  }

  /**
   * Update dropdown option labels based on current language
   */
  updateDropdownTranslations() {
    this.priorities = [
      { label: this.translateService.instant('taskSidebar.low'), value: 'low' },
      { label: this.translateService.instant('taskSidebar.medium'), value: 'medium' },
      { label: this.translateService.instant('taskSidebar.high'), value: 'high' }
    ];

    this.states = [
      { label: this.translateService.instant('tasks.toDo'), value: 'todo' },
      { label: this.translateService.instant('tasks.inProgress'), value: 'inprogress' },
      { label: this.translateService.instant('tasks.completed'), value: 'completed' }
    ];
  }

  /**
   * Get localized status for display
   */
  getLocalizedStatus(status: string): string {
    switch (status) {
      case 'todo': return this.translateService.instant('tasks.toDo');
      case 'inprogress': return this.translateService.instant('tasks.inProgress');
      case 'completed': return this.translateService.instant('tasks.completed');
      default: return status;
    }
  }

  loadUsers() {
    this.isLoading = true;
    this.usersService.getUsers(1, 100)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.result && response.result.users) {
            this.users = response.result.users;
            this.assigneeOptions = this.users.map(user => ({
              label: user.name,
              value: user.id
            }));
          } else {
            console.warn('No users found in the response:', response);
            this.assigneeOptions = [];
          }
        },
        error: (error) => {
          console.error('Error loading users:', error);
          // this.toastService.error('Failed to load users');
          this.assigneeOptions = [];
        }
      });
  }

  loadProjects() {
    this.isLoading = true;
    this.projectsService.getProjects(1, 100)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.result && response.result.projects) {
            this.projects = response.result.projects.map(project => ({
              label: project.name,
              value: project.id
            }));
          } else {
            console.warn('No projects found in the response:', response);
            this.projects = [];
          }
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          // this.toastService.error('Failed to load projects');
          this.projects = [];
        }
      });
  }

  private initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      projectId: ['', Validators.required],
      priority: ['low', Validators.required],
      status: ['todo', Validators.required],
      dueDate: [new Date(), Validators.required],
      assignedTo: [[]],  // Now using MultiSelect component
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

  openSidebar(taskData?: Task, mode: Mode = 'add', projectsList: any[] = []): void {
    this.visible = true;
    this.mode = mode;

    // Only use provided projects list if it's not empty
    if (projectsList && projectsList.length > 0) {
      this.projects = projectsList;
    }

    // Clear previous data
    this.resetForm();

    if (taskData && (mode === 'edit' || mode === 'view')) {
      this.taskId = taskData.id;
      this.loadTaskDetails(taskData.id);
    } else {
      // Reset form for new task
      this.taskForm.reset({
        priority: 'low',
        status: 'todo',
        dueDate: new Date(),
        assignedTo: []
      });
    }

    if (mode === 'view') {
      this.taskForm.disable();
    } else {
      this.taskForm.enable();
    }
  }

  private resetForm(): void {
    this.taskId = null;
    this.currentTask = null;
    this.selectedAssignees = [];
    this.attachmentsList = [];
    this.uploadedFiles = [];
    this.comments = [];
    this.commentContent = '';

    // Clear subtasks
    while (this.subTasks.length) {
      this.subTasks.removeAt(0);
    }
  }

  private loadTaskDetails(taskId: string): void {
    this.isLoading = true;

    this.tasksService.getTaskById(taskId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.currentTask = response.result;

          // Format the task data for the form
          const formattedTask = {
            title: this.currentTask.title,
            projectId: this.currentTask.projectId,
            priority: this.currentTask.priority,
            status: this.currentTask.status,
            dueDate: new Date(this.currentTask.dueDate),
            assignedTo: this.currentTask.assignedTo.map((user: { id: any; }) => user.id),
            description: this.currentTask.description,
            attachments: []
          };

          this.taskForm.patchValue(formattedTask);
          this.selectedAssignees = formattedTask.assignedTo;

          // Set up the subtasks
          if (this.currentTask.subTasks && this.currentTask.subTasks.length > 0) {
            this.currentTask.subTasks.forEach((subTask: { title: any; description: any; completed: any; }) => {
              this.subTasks.push(this.fb.group({
                title: subTask.title,
                description: subTask.description,
                completed: subTask.completed
              }));
            });
          }

          // Load comments if available
          if (this.currentTask.comments) {
            this.comments = this.currentTask.comments;
          }

          // Set up the attachments list for display
          this.attachmentsList = this.currentTask.files.map((file: { id: any; name: any; path: any; }) => ({
            id: file.id,
            name: file.name || 'File',
            path: file.path || '',
            size: '12 MB', // Size not provided in the API
            type: this.getFileTypeFromName(file.name || '')
          }));

          // Set project info if available
          if (this.currentTask.project) {
            this.projectName = this.currentTask.project.name;
          }

          // Set created info (placeholders - actual data might come from API)
          this.createdDate = new Date().toLocaleString();
          this.createdBy = 'User';

          // If in view mode, disable the form
          if (this.isViewMode) {
            this.taskForm.disable();
          }
        },
        error: (error) => {
          console.error('Error loading task details:', error);
          // this.toastService.error('Failed to load task details');
          this.closeSidebar();
        }
      });
  }

  closeSidebar(): void {
    this.visible = false;
    this.resetForm();
    this.close.emit();
  }

  switchToEditMode(): void {
    this.mode = 'edit';
    this.taskForm.enable();
  }

  // For file uploads
  onUpload(event: any): void {
    // If files are provided directly
    if (event.files && event.files.length > 0) {
      // For comment attachments (if active tab is comments)
      if (this.activeTab === 'comments') {
        this.uploadedFiles = [event.files[0]]; // Only keep one file for comments
      } else {
        // For regular task attachments, add all files
        this.uploadedFiles = [...this.uploadedFiles, ...event.files];
      }

      // Update the form control if we're on the main form
      if (this.taskForm) {
        this.taskForm.patchValue({ attachments: this.uploadedFiles });
      }

      // Clear the fileUpload component
      if (this.fileUpload) {
        this.fileUpload.clear();
      }
    }
  }

  removeAttachment(index: number): void {
    if (index >= 0 && index < this.uploadedFiles.length) {
      this.uploadedFiles.splice(index, 1);

      // Update the form control
      if (this.taskForm) {
        this.taskForm.patchValue({ attachments: this.uploadedFiles });
      }
    }
  }

  removeExistingAttachment(fileId: string): void {
    if (!fileId) return;

    // In a real app, you would call an API to delete the file
    // For now, we'll just remove it from the UI
    this.attachmentsList = this.attachmentsList.filter(file => file.id !== fileId);
  }

  createComment() {
    if (!this.commentContent.trim()) {
      // this.toastService.warning('Please enter a comment');
      return;
    }

    this.submittingComment = true;

    const commentData = {
      content: this.commentContent,
      file: this.uploadedFiles.length > 0 ? this.uploadedFiles[0] : undefined
    };

    this.tasksService.createComment(this.taskId!, commentData)
      .pipe(finalize(() => this.submittingComment = false))
      .subscribe({
        next: (response) => {
          // this.toastService.success('Comment added successfully');
          this.commentContent = '';
          this.uploadedFiles = [];
          // Refresh task details to show the new comment
          if (this.taskId) {
            this.loadTaskDetails(this.taskId);
          }
        },
        error: (error) => {
          console.error('Error adding comment:', error);
          // this.toastService.error('Failed to add comment');
        }
      });
  }

  editTask() {
    this.switchToEditMode();
  }

  deleteTask() {
    const confirmMessage = this.translateService.instant('confirmations.deleteTask');

    if (this.taskId && confirm(confirmMessage)) {
      this.isLoading = true;

      this.tasksService.deleteTask(this.taskId)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            // this.toastService.success('Task deleted successfully');
            this.closeSidebar();
            // Refresh the task list
            this.saved.emit({ action: 'delete', taskId: this.taskId });
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            // this.toastService.error('Failed to delete task');
          }
        });
    }
  }

  downloadAttachment(file: any) {
    if (!file || !file.path) {
      // this.toastService.warning('File path not available');
      return;
    }

    const url = this.tasksService.getFileUrl(file.path);
    if (!url) {
      // this.toastService.error('Could not generate download URL');
      return;
    }

    // Open the file in a new tab
    window.open(url, '_blank');
  }

  downloadAllAttachments() {
    if (!this.attachmentsList || this.attachmentsList.length === 0) {
      const noAttachmentsMsg = this.translateService.instant('taskSidebar.noAttachments');
      // this.toastService.warning(noAttachmentsMsg);
      return;
    }

    // Download each attachment with a small delay to prevent browser blocking
    this.attachmentsList.forEach((file, index) => {
      setTimeout(() => {
        this.downloadAttachment(file);
      }, index * 500); // 500ms delay between downloads
    });
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formData = this.taskForm.value;

      // Format the date for the API
      const dueDate = formData.dueDate instanceof Date
        ? formData.dueDate.toISOString()
        : formData.dueDate;

      this.isLoading = true;

      if (this.isEditMode && this.taskId) {
        // Update existing task
        const updateData: any = {
          title: formData.title,
          priority: formData.priority,
          status: formData.status,
          projectId: formData.projectId,
          dueDate: dueDate,
          description: formData.description,
          assignedTo: formData.assignedTo || []
        };

        // Handle subtasks if any
        if (this.subTasks.length > 0) {
          updateData.subTasks = this.subTasks.value;
        }

        this.tasksService.updateTask(this.taskId, updateData)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: (response) => {
              // this.toastService.success('Task updated successfully');
              this.saved.emit({ action: 'update', task: response.result });
              this.closeSidebar();
            },
            error: (error) => {
              console.error('Error updating task:', error);
              // this.toastService.error('Failed to update task: ' + (error.error?.message || 'Unknown error'));
            }
          });
      } else {
        // Create new task
        const createData: any = {
          title: formData.title,
          priority: formData.priority,
          status: formData.status,
          projectId: formData.projectId,
          dueDate: dueDate,
          description: formData.description,
          assignedTo: formData.assignedTo || [],
          files: this.uploadedFiles
        };

        // Add subtasks if any
        if (this.subTasks.length > 0) {
          createData.subTasks = this.subTasks.value;
        }

        this.tasksService.createTask(createData)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: (response) => {
              // this.toastService.success('Task created successfully');
              this.saved.emit({ action: 'create', task: response.result });
              this.closeSidebar();
              // Reset the form after successful creation
              this.resetForm();
            },
            error: (error) => {
              console.error('Error creating task:', error);
              // this.toastService.error('Failed to create task: ' + (error.error?.message || 'Unknown error'));
            }
          });
      }
    } else {
      this.markFormGroupTouched(this.taskForm);
      // this.toastService.error('Please fill in all required fields correctly');
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
    if (errors['required']) return this.translateService.instant('taskSidebar.requiredField');
    if (errors['minlength']) {
      return this.translateService.instant('taskSidebar.minLength', {
        0: errors['minlength'].requiredLength
      });
    }
    return this.translateService.instant('taskSidebar.invalidInput');
  }

  getPriorityClass(priority: string | undefined | null): string {
    if (!priority) return '';

    switch (priority.toLowerCase()) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      default: return '';
    }
  }

  getStatusClass(status: string | undefined | null): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'todo': return 'state-todo';
      case 'inprogress': return 'state-progress';
      case 'completed': return 'state-done';
      default: return '';
    }
  }

  // Helper method to get file icon based on file type or name
  getFileIcon(fileIdentifier: string): string {
    if (!fileIdentifier) return 'pi-file';

    // Check if it's a mime type
    if (fileIdentifier.includes('/')) {
      if (fileIdentifier.includes('pdf')) return 'pi-file-pdf';
      if (fileIdentifier.includes('image')) return 'pi-image';
      if (fileIdentifier.includes('word')) return 'pi-file-word';
      if (fileIdentifier.includes('excel')) return 'pi-file-excel';
      if (fileIdentifier.includes('powerpoint')) return 'pi-file-powerpoint';
      if (fileIdentifier.includes('zip')) return 'pi-file-archive';
    } else {
      // It's a filename, extract extension
      const extension = fileIdentifier.split('.').pop()?.toLowerCase();

      switch (extension) {
        case 'pdf': return 'pi-file-pdf';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'pi-image';
        case 'doc':
        case 'docx': return 'pi-file-word';
        case 'xls':
        case 'xlsx': return 'pi-file-excel';
        case 'ppt':
        case 'pptx': return 'pi-file-powerpoint';
        case 'zip': return 'pi-file-archive';
      }
    }

    return 'pi-file';
  }

  // Helper method to get file type from name
  private getFileTypeFromName(fileName: string): string {
    if (!fileName) return 'application/octet-stream';

    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'doc':
      case 'docx': return 'application/msword';
      case 'xls':
      case 'xlsx': return 'application/vnd.ms-excel';
      case 'ppt':
      case 'pptx': return 'application/vnd.ms-powerpoint';
      case 'zip': return 'application/zip';
      default: return 'application/octet-stream';
    }
  }
}
