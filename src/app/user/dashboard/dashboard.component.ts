import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Timestamp } from 'firebase/firestore';

interface ToolUsageHistory {
  Name: string;
  ModelNumber: string;
  Brand: string;
  LastCheckedOutDate?: Timestamp | Date | null; // Allow Firestore Timestamp or Date
  ReturnedDate?: Timestamp | Date | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  currentUserName: string = 'User'; // Default fallback name
  usageHistory: ToolUsageHistory[] = [];

  constructor(
    private authService: AuthService,
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.fetchUsageHistory();
  }

  // Fetch the current user's name
  loadCurrentUser() {
    this.auth.authState.subscribe((user) => {
      if (user) {
        this.currentUserName = user.displayName || 'User'; // Default to 'User' if no display name
      }
    });
  }

  // Fetch the user's tool usage history
  fetchUsageHistory() {
    this.auth.authState.subscribe((user) => {
      if (user && user.email) {
        this.firestore
          .collection<ToolUsageHistory>('tools', (ref) =>
            ref.where('LastCheckedOutUser', '==', user.email)
          )
          .valueChanges()
          .subscribe((data) => {
            console.log('Raw Firestore Data:', data); // Debugging output
            this.usageHistory = data.map((tool) => {
              let lastCheckedOutDate = null;
              if (tool.LastCheckedOutDate) {
                if ('toDate' in tool.LastCheckedOutDate && typeof tool.LastCheckedOutDate.toDate === 'function') {
                  lastCheckedOutDate = tool.LastCheckedOutDate.toDate(); // Convert Timestamp to Date
                } else if (tool.LastCheckedOutDate instanceof Date) {
                  lastCheckedOutDate = tool.LastCheckedOutDate; // Already a Date
                }
              }
              console.log('Tool LastCheckedOutDate (before mapping):', tool.LastCheckedOutDate);
              console.log('Mapped LastCheckedOutDate:', lastCheckedOutDate);
  
              return {
                Name: tool.Name || 'Unknown Tool',
                ModelNumber: tool.ModelNumber || 'Unknown Model',
                Brand: tool.Brand || 'Unknown Brand',
                LastCheckedOutDate: lastCheckedOutDate,
                ReturnedDate:
                  tool.ReturnedDate &&
                  'toDate' in tool.ReturnedDate &&
                  typeof tool.ReturnedDate.toDate === 'function'
                    ? tool.ReturnedDate.toDate()
                    : tool.ReturnedDate instanceof Date
                    ? tool.ReturnedDate
                    : null,
              };
            });
            console.log('Processed Usage History:', this.usageHistory); // Debug processed data
          });
      }
    });
  }
  
  
  
  
  convertToDate(value: Timestamp | Date | null): Date | null {
    if (!value) {
      return null; // Return null if value is null or undefined
    }
    if (value instanceof Timestamp) {
      return value.toDate(); // Convert Firestore Timestamp to Date
    }
    if (value instanceof Date) {
      return value; // Already a Date object
    }
    return null; // Handle unexpected types
  }
  
  
  getDate(date: Timestamp | Date | null): Date | null {
    if (date instanceof Timestamp) {
      return date.toDate(); // Convert Firestore Timestamp to Date
    }
    if (date instanceof Date) {
      return date; // Already a Date object
    }
    return null; // Return null for missing dates
  }
  
  
  
}
