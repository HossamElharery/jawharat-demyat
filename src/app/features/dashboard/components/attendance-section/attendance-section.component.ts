import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AttendanceRecord } from '../../services/dashboard.service';

// Define display data structure for the table
interface DisplayRecord {
  id: string;
  name: string;
  designation: string;
  type: string;
  checkIn: string;
  status: string;
  avatar: string;
}

@Component({
  selector: 'app-attendance-section',
  standalone: true,
  imports: [CommonModule, TableModule, AvatarModule, TagModule, ButtonModule],
  templateUrl: './attendance-section.component.html',
  styleUrl: './attendance-section.component.scss'
})
export class AttendanceSectionComponent implements OnChanges {
  @Input() attendanceData: AttendanceRecord[] = [];

  // Transformed data for the table
  displayData: DisplayRecord[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    console.log('AttendanceSection ngOnChanges, data:', this.attendanceData);
    if (changes['attendanceData']) {
      this.transformAttendanceData();
    }
  }

  // Transform API data to match the template's expected structure
  transformAttendanceData(): void {
    // Safety check
    if (!this.attendanceData || !Array.isArray(this.attendanceData) || this.attendanceData.length === 0) {
      console.log('No attendance data to transform');
      this.displayData = [];
      return;
    }

    console.log(`Transforming ${this.attendanceData.length} attendance records`);

    // Map API data to display format
    this.displayData = this.attendanceData.map(record => {
      // Convert status from API format to display format
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
        designation: 'Staff', // Default designation if not provided
        type: 'Full Time', // Default type if not provided
        checkIn: record.checkIn ? this.formatTime(record.checkIn) : 'N/A',
        status: displayStatus,
        // Use default avatar if none provided
        avatar: record.employeeImage || '../../../../../assets/images/' + this.getRandomAvatar()
      };
    });
  }

  // Format the check-in time for display
  formatTime(time: string): string {
    if (!time) return 'N/A';

    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Generate a random avatar from the existing ones for demo purposes
  getRandomAvatar(): string {
    const avatars = ['leasie.png', 'darlene.png', 'jacob.png', 'kathryn.png', 'leslie.png', 'ronald.png', 'jenny.png'];
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex];
  }
}
