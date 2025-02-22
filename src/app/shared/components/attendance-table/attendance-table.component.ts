import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { MatDialog } from '@angular/material/dialog';

type PrimeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

interface ActionButton {
  type: 'pay' | 'view';
  label?: string;
  icon?: string;
}

export interface Column {
  field: string;
  header: string;
  type?: 'text' | 'avatar' | 'tag' | 'actions';
  tagConfig?: {
    field: string;
    severityMap: Record<string, Exclude<PrimeSeverity, undefined>>;
  };
  avatarConfig?: {
    imageField: string;
    nameField: string;
  };
  actionConfig?: {
    buttons: ActionButton[];
  };
}
@Component({
  selector: 'app-attendance-table',
  imports: [CommonModule , TableModule,AvatarModule,TagModule , ButtonModule],
  templateUrl: './attendance-table.component.html',
  styleUrl: './attendance-table.component.scss'
})
export class AttendanceTableComponent {
  @Input() data: any[] = [];
  @Input() columns: Column[] = [];
  @Input() viewComponent: any; // Component to be opened in dialog

  @Output() payClick = new EventEmitter<any>();

  constructor(private dialog: MatDialog) {}

  getSeverity(value: string, severityMap: Record<string, Exclude<PrimeSeverity, undefined>>): PrimeSeverity {
    return severityMap[value] || 'info';
  }

  onPayClick(record: any): void {
    this.payClick.emit(record);
  }

  onViewClick(record: any): void {
    const dialogRef = this.dialog.open(this.viewComponent, {
      maxWidth: '1200px',
      width: '1000px',
      panelClass: 'user-modal-dialog',
      data: { ...record, isEditing: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Emit updated data if needed
      }
    });
  }
}
