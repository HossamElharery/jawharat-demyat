import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AttendanceRecord } from '../../services/dashboard.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface DisplayRecord {
  id: string;
  name: string;
  designation: string;
  type: string;
  checkIn: string;
  status: string;
  avatar: any;
}

@Component({
  selector: 'app-attendance-section',
  standalone: true,
  imports: [CommonModule, TableModule, AvatarModule, TagModule, ButtonModule, ImageUrlPipe, TranslateModule],
  templateUrl: './attendance-section.component.html',
  styleUrl: './attendance-section.component.scss'
})
export class AttendanceSectionComponent implements OnChanges {
  @Input() attendanceData: AttendanceRecord[] = [];

  displayData: DisplayRecord[] = [];

  constructor(private translateService: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('AttendanceSection ngOnChanges, data:', this.attendanceData);
    if (changes['attendanceData']) {
      this.transformAttendanceData();
    }
  }

  transformAttendanceData(): void {
     if (!this.attendanceData || !Array.isArray(this.attendanceData) || this.attendanceData.length === 0) {
      console.log('No attendance data to transform');
      this.displayData = [];
      return;
    }

    console.log(`Transforming ${this.attendanceData.length} attendance records`);

     this.displayData = this.attendanceData.map(record => {
       let displayStatus = 'Unknown';
      if (record.status) {
        switch (record.status.toLowerCase()) {
          case 'present':
            displayStatus = 'Attended';
            break;
          case 'absent':
            displayStatus = 'Absence';
            break;
          case 'holiday':
            displayStatus = 'Holiday';
            break;
          case 'leave':
            displayStatus = 'Leave';
            break;
          default:
            displayStatus = record.status.charAt(0).toUpperCase() + record.status.slice(1);
        }
      }

      return {
        id: record.id || '',
        name: record.employeeName || 'Unknown',
        designation: 'Staff',
        type: 'Full Time',
        checkIn: record.checkIn ? this.formatTime(record.checkIn) : 'N/A',
        status: displayStatus,
        avatar: record.employeeImage || null
      };
    });
  }

  formatTime(time: string): string {
    if (!time) return 'N/A';

    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
