import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TableModule } from 'primeng/table';
import { DragDropModule } from 'primeng/dragdrop';
import { IconComponent } from "../../../../shared/components/icon/icon.component";
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { AddTaskSidebarComponent } from '../../components/add-task-sidebar/add-task-sidebar.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { Task, TasksService } from '../../services/tasks.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ProjectsService } from '../../../projects/services/projects.service';
import { ChipModule } from 'primeng/chip';

// Use the global toast service from the HttpResponseInterceptor

export interface TaskMember {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
}

interface FilterOption {
  label: string;
  value: string;
  icon?: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    AvatarModule,
    AvatarGroupModule,
    TableModule,
    DragDropModule,
    IconComponent,
    DropdownModule,
    SelectButtonModule,
    FormsModule,
    AddTaskSidebarComponent,
    ChipModule
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  viewMode: 'kanban' | 'table' = 'kanban';
  draggedTask: Task | null = null;
  isLoading: boolean = false;
  tasks: Task[] = [];
  projects: any[] = [];
  members: any[] = []; // Will be populated from the backend

  filterOptions: FilterOption[] = [
    { label: 'All Tasks', value: 'all' },
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'inprogress' },
    { label: 'Completed', value: 'completed' }
  ];

  memberOptions: FilterOption[] = [
    { label: 'All Members', value: 'all' }
    // We'll add more from the API
  ];

  selectedFilter: string = 'all';
  selectedMember: string = 'all';

  @ViewChild('addTaskSidebar') addTaskSidebar!: AddTaskSidebarComponent;

  constructor(
    private tasksService: TasksService,
    private projectsService: ProjectsService,
   ) {}

  ngOnInit() {
    this.loadTasks();
    this.loadProjects(); // Load projects for the dropdown
  }

  loadProjects() {
    this.tasksService.getProjects()
      .subscribe({
        next: (response) => {
          // Ensure result is an array before calling map
          if (Array.isArray(response.result)) {
            this.projects = response.result.map(project => ({
              label: project.name,
              value: project.id
            }));
          } else {
            // Handle case where result is not an array
            console.warn('Projects response is not an array:', response);
            this.projects = [];
          }
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.projects = [];
        }
      });
  }

  loadTasks() {
    this.isLoading = true;

    // If using by-status endpoint for kanban view
    if (this.viewMode === 'kanban') {
      this.tasksService.getTasksByStatus()
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            // Process and organize tasks by status
            this.tasks = [];

            response.result.forEach(statusGroup => {
              // Map API status to UI state
              const state = this.mapStatusToState(statusGroup.status);

              // Add state property to each task for UI
              const tasksWithState = statusGroup.tasks.map(task => ({
                ...task,
                state
              }));

              this.tasks.push(...tasksWithState);
            });
          },
          error: (error) => {
            console.error('Error loading tasks by status:', error);
            // this.toastService.error('Failed to load tasks');
          }
        });
    } else {
      // For table view, load all tasks
      const status = this.selectedFilter !== 'all' ? this.selectedFilter : undefined;

      this.tasksService.getTasks(1, 100, undefined, status)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            this.tasks = response.result.tasks.map(task => ({
              ...task,
              state: this.mapStatusToState(task.status)
            }));
          },
          error: (error) => {
            console.error('Error loading tasks:', error);
            // this.toastService.error('Failed to load tasks');
          }
        });
    }
  }

  // Map API status values to UI state values
  private mapStatusToState(status: string): string {
    switch (status.toLowerCase()) {
      case 'todo': return 'To Do';
      case 'inprogress': return 'In Progress';
      case 'completed': return 'Done';
      default: return status;
    }
  }

  // Map UI state values back to API status values
  private mapStateToStatus(state: string): string {
    switch (state) {
      case 'To Do': return 'todo';
      case 'In Progress': return 'inprogress';
      case 'Done': return 'completed';
      default: return state.toLowerCase();
    }
  }

  openAddTaskSidebar() {
    this.addTaskSidebar.openSidebar(undefined, 'add', this.projects);
  }

  onSidebarClose() {
    // No specific cleanup needed
  }

  getFilterLabel(): string {
    if (this.selectedFilter === 'all') {
      return 'Filter';
    }
    const option = this.filterOptions.find(o => o.value === this.selectedFilter);
    return option ? option.label : 'Filter';
  }

  getMemberLabel(): string {
    if (this.selectedMember === 'all') {
      return 'All Members';
    }
    const option = this.memberOptions.find(o => o.value === this.selectedMember);
    return option ? option.label : 'All Members';
  }

  onFilterChange(event: any): void {
    this.selectedFilter = event.value;
    this.loadTasks(); // Reload tasks with the new filter
  }

  onMemberChange(event: any): void {
    this.selectedMember = event.value;
    this.loadTasks(); // Reload tasks filtered by member
  }

  getTasks(status: string): Task[] {
    return this.tasks.filter(task => task.state === status);
  }

  onDragStart(event: DragEvent, task: Task) {
    this.draggedTask = task;
  }

  onDragEnd() {
    this.draggedTask = null;
  }

  onDrop(event: DragEvent, newState: string) {
    if (this.draggedTask) {
      const taskId = this.draggedTask.id;
      const newStatus = this.mapStateToStatus(newState);

      // Check if the status has actually changed to avoid unnecessary API calls
      if (this.draggedTask.status !== newStatus) {
        // Optimistically update the UI
        const previousStatus = this.draggedTask.status;
        const previousState = this.draggedTask.state;

        this.draggedTask.state = newState;
        this.draggedTask.status = newStatus;

        // Call API to update the task status
        this.tasksService.updateTaskStatus(taskId, newStatus)
          .subscribe({
            next: (response) => {
              // this.toastService.success('Task status updated successfully');
            },
            error: (error) => {
              console.error('Error updating task status:', error);
              // this.toastService.error('Failed to update task status');

              // Revert the optimistic update on error
              this.draggedTask!.state = previousState;
              this.draggedTask!.status = previousStatus;
            }
          });
      }

      this.draggedTask = null;
    }
  }

  get allTasks(): Task[] {
    return this.tasks;
  }

  getTaskCount(state: string): number {
    return this.getTasks(state).length;
  }

  viewTask(task: Task) {
    // Instead of passing the task directly, pass the task ID and let the sidebar fetch the complete data
    this.addTaskSidebar.openSidebar(task, 'view', this.projects);
  }

  editTask(task: Task) {
    this.addTaskSidebar.openSidebar(task, 'edit', this.projects);
  }

  deleteTask(task: Task) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.isLoading = true;

      this.tasksService.deleteTask(task.id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            // this.toastService.success('Task deleted successfully');
            this.loadTasks(); // Reload tasks to reflect the deletion
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            // this.toastService.error('Failed to delete task');
          }
        });
    }
  }

  onTaskSaved(event: any) {
    console.log('Task saved:', event);
    this.loadTasks(); // Reload tasks to reflect the changes
  }

  // Helper methods for member display
  getMemberImage(member: any): string {
    if (!member) return '../../../../../assets/images/Ellipse 15.png';

    // Check if member is properly formed object with imageUrl property
    if (typeof member === 'object' && member !== null && 'imageUrl' in member && member.imageUrl) {
      return this.getFileUrl(member.imageUrl);
    }

    return '../../../../../assets/images/Ellipse 15.png';
  }

  getMemberInitial(member: any): string {
    if (!member) return 'U';

    // Check if member is properly formed object with name property
    if (typeof member === 'object' && member !== null && 'name' in member && member.name) {
      return member.name.charAt(0).toUpperCase();
    }

    return 'U';
  }

  // Helper function to get file URL
  getFileUrl(path: string): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${environment.apiBaseUrl}${path}`;
  }
}
