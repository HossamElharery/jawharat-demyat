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
interface Member {
  id: number;
  name: string;
  image: string;
}
interface TaskModel {
  id?: number;
  title: string;
  projectId: string;
  priority: string;
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
interface Task {
  id: number;
  title: string;
  description: string;
  state: 'To Do' | 'In Progress' | 'Done'|string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: Member[];
  comments: number;
  files: number;
  deadline: string;
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
    FormsModule,AddTaskSidebarComponent,
 ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  viewMode: 'kanban' | 'table' = 'kanban';
  draggedTask: Task | null = null;
  filterOptions: FilterOption[] = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Recent Tasks', value: 'recent' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Important', value: 'important' }
  ];

  memberOptions: FilterOption[] = [
    { label: 'All Members', value: 'all' },
    { label: 'Team Leads', value: 'leads' },
    { label: 'Developers', value: 'devs' },
    { label: 'Designers', value: 'designers' }
  ];

  selectedFilter: string = 'all';
  selectedMember: string = 'all';
  @ViewChild('addTaskSidebar') addTaskSidebar!: AddTaskSidebarComponent;

  openAddTaskSidebar() {
    this.addTaskSidebar.openSidebar();
  }

  onSidebarClose() {
    // Handle any cleanup or refresh needed after closing
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
  }

  onMemberChange(event: any): void {
    this.selectedMember = event.value;
  }

  members: Member[] = [
    { id: 1, name: 'John Doe', image: '../../../../../assets/images/Ellipse 15.png' },
    { id: 2, name: 'Jane Smith', image: '../../../../../assets/images/Ellipse 15.png' },
    { id: 3, name: 'Bob Johnson', image: '../../../../../assets/images/Ellipse 15.png' }
  ];

  tasks: Task[] = Array(12).fill(null).map((_, index) => ({
    id: index + 1,
    title: 'Brainstorming',
    description: "Brainstorming brings team members' diverse experience into play.",
    state: index % 3 === 0 ? 'To Do' : index % 3 === 1 ? 'In Progress' : 'Done',
    priority: 'Low',
    assignedTo: this.members.slice(0, 2),
    comments: 12,
    files: 0,
    deadline: '25/12/2024'
  }));

  constructor() {}

  ngOnInit() {}

  getTasks(status: string): Task[] {
    return this.tasks.filter(task => task.state === status);
  }

  onDragStart(event: DragEvent, task: Task) {
    this.draggedTask = task;
  }

  onDragEnd() {
    this.draggedTask = null;
  }

  onDrop(event: DragEvent, newState: 'To Do' | 'In Progress' | 'Done' |string) {
    if (this.draggedTask) {
        const task = { ...this.draggedTask }; // Create a copy of the task
        // Update task state
        this.draggedTask.state = newState;

        // Call API to update task state before clearing draggedTask
        this.updateTaskState(task, newState);

        // Clear dragged task
        this.draggedTask = null;
    }
}
private async updateTaskState(task: Task, newState: string) {
  try {
      // Simulated API call - replace with actual API call
      console.log(`Updating task ${task.id} to state: ${newState}`);
      // await this.taskService.updateTask(task.id, { state: newState });
  } catch (error) {
      console.error('Error updating task state:', error);
      // Handle error (e.g., show error message, revert state)
  }
}

  get allTasks(): Task[] {
    return this.tasks;
  }

  getColumnTasks(state: string): Task[] {
    return this.tasks.filter(task => task.state === state);
  }

  getTaskCount(state: string): number {
    return this.getColumnTasks(state).length;
  }

  toggleView() {
    this.viewMode = this.viewMode === 'kanban' ? 'table' : 'kanban';
  }
  onTaskSaved(task: TaskModel) {
    // Handle the saved task
    console.log('Task saved:', task);
  }
}
