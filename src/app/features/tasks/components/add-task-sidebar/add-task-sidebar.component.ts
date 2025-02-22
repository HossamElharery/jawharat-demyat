// add-task-sidebar.component.ts
import { AfterViewInit, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Component Imports
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';

interface TaskPriority {
  label: string;
  value: string;
}

interface TaskState {
  label: string;
  value: string;
}

@Component({
  selector: 'app-add-task-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    FileUploadModule,
    TextareaModule,
    ChipModule
  ],
  templateUrl: './add-task-sidebar.component.html',
  styleUrls: ['./add-task-sidebar.component.scss']
})
export class AddTaskSidebarComponent implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('sidebar') sidebar!: Sidebar;
  ngAfterViewInit() {
     if (this.sidebar) {
      const mask = document.querySelector('.p-sidebar-mask');
      if (mask) {
        mask.addEventListener('click', (event) => {
          if (event.target === mask) {
            this.closeSidebar();
          }
        });
      }
    }
  }
  // UI Control
  visible: boolean = false;

  // Header Info
  projectName: string = 'Project Name';
  createdDate: string = 'Mar 23, 10:34 PM';
  createdBy: string = 'Mohamed Ali';

  // Direct Form Properties
  selectedState: string = 'done';
  dueDate: Date = new Date('2024-12-25');
  assignees: string[] = ['@mustafa', '@mustafa', '@mustafa'];
  selectedPriority: string = 'low';
  description: string = 'Lorem ipsum dolor sit amet consectetur...';
  title: string = 'New Task to Build House';

  // Dropdown Options
  states: TaskState[] = [
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'inprogress' },
    { label: 'Done', value: 'done' }
  ];

  priorities: TaskPriority[] = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }
  ];

  // Lists
  subTasks = [
    { title: 'Understanding Client brief', completed: true },
    { title: 'Understanding Client brief', completed: true },
    { title: 'Understanding Client brief', completed: false },
    { title: 'Understanding Client brief', completed: false }
  ];

  attachments = [
    { name: 'Task Attachment Details.pdf', size: '12 MB' },
    { name: 'Task Attachment Details.pdf', size: '12 MB' }
  ];

  newAssignee: any;
  activeTab: 'subtasks' | 'comments' = 'subtasks';

  openSidebar() {
    this.visible = true;
  }

  closeSidebar() {
    this.visible = false;
    this.close.emit();
  }

  handleClose() {
    // This will be called by p-sidebar's onHide event
    this.closeSidebar();
  }

  onUpload(event: any) {
    console.log('File uploaded:', event);
  }

  handleCheckboxClick(task: any) {
    task.completed = !task.completed;
  }

  // Form handling methods
  onStateChange(event: any) {
    this.selectedState = event.value;
  }

  onPriorityChange(event: any) {
    this.selectedPriority = event.value;
  }

  onAssigneeAdd(event: any) {
    console.log('Assignee added:', event);
  }

  onAssigneeRemove(event: any) {
    console.log('Assignee removed:', event);
  }

  setActiveTab(tab: 'subtasks' | 'comments') {
    this.activeTab = tab;
  }

  editTask() {
    // handle edit action
    console.log('Edit task');
  }

  deleteTask() {
    // handle delete action
    console.log('Delete task');
  }

  downloadAll() {
    // handle "Download All" action
    console.log('Download all attachments');
  }
}
