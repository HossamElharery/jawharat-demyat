import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
interface AttendanceRecord {
  name: string;
  designation: string;
  type: string;
  checkIn: string;
  status: string;
  avatar: string;
}
@Component({
  selector: 'app-attendance-table',
  imports: [CommonModule , TableModule,AvatarModule,TagModule , ButtonModule],
  templateUrl: './attendance-table.component.html',
  styleUrl: './attendance-table.component.scss'
})
export class AttendanceTableComponent {
  attendanceData: AttendanceRecord[] = [
    {
      name: 'Leasie Watson',
      designation: 'Worker',
      type: 'Full Time',
      checkIn: '09:27 AM',
      status: 'Attended',
      avatar: '../../../../../assets/images/leasie.png'
    },
    {
      name: 'Darlene Robertson',
      designation: 'Super Visor',
      type: 'Full Time',
      checkIn: '10:15 AM',
      status: 'Absence',
      avatar: '../../../../../assets/images/darlene.png'
    },
    {
      name: 'Jacob Jones',
      designation: 'Worker',
      type: 'Full Time',
      checkIn: '10:24 AM',
      status: 'Absence',
      avatar: '../../../../../assets/images/jacob.png'
    },
    {
      name: 'Kathryn Murphy',
      designation: 'Manger',
      type: 'Full Time',
      checkIn: '09:10 AM',
      status: 'Attended',
      avatar: '../../../../../assets/images/kathryn.png'
    },
    {
      name: 'Leslie Alexander',
      designation: 'Worker',
      type: 'Full Time',
      checkIn: '09:15 AM',
      status: 'Attended',
      avatar: '../../../../../assets/images/leslie.png'
    },
    {
      name: 'Ronald Richards',
      designation: 'Worker',
      type: 'Full Time',
      checkIn: '09:29 AM',
      status: 'Attended',
      avatar: '../../../../../assets/images/ronald.png'
    },
    {
      name: 'Jenny Wilson',
      designation: 'Worker',
      type: 'Full Time',
      checkIn: '11:30 AM',
      status: 'Absence',
      avatar: '../../../../../assets/images/jenny.png'
    }
  ];
}
