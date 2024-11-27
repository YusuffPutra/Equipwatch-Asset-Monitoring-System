import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, startWith, tap, catchError } from 'rxjs/operators';

interface ToolRequest {
  id: string;
  userID: string;
  toolID: string;
  toolName?: string;
  email?: string;
  reason?: string;
  status: string;
  timereq: any;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  toolRequests: ToolRequest[] = [];
  isSignupModalOpen = false;
  newUser = { email: '', password: '', role: 'user' };

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchToolRequests();
  }

  fetchToolRequests() {
    this.firestore.collection<ToolRequest>('toolrequests', ref =>
      ref.where('status', '==', 'Pending')
    ).valueChanges({ idField: 'id' })
      .subscribe({
        next: (requests) => {
          // Convert Firestore timestamp to JavaScript Date
          this.toolRequests = requests.map(request => ({
            ...request,
            timereq: request.timereq ? (request.timereq as any).toDate() : null  // Convert timestamp
          }));
          console.log("Converted toolRequests:", this.toolRequests);  // Log to verify conversion
        },
        error: (error) => {
          console.error("Error fetching tool requests:", error);
        }
      });
  }
  

  openSignupModal() {
    this.isSignupModalOpen = true;
  }

  closeSignupModal() {
    this.isSignupModalOpen = false;
    this.newUser = { email: '', password: '', role: 'user' }; // Reset the form
  }

  createUser() {
    const { email, password, role } = this.newUser;
  
    // Step 1: Create the user in Firebase Authentication
    this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Step 2: Add the user details to Firestore
        const userId = userCredential.user?.uid;
        if (userId) {
          return this.firestore.collection('users').doc(userId).set({ email, role });
        } else {
          // Explicitly return a resolved Promise if userId is undefined
          return Promise.resolve();
        }
      })
      .then(() => {
        console.log('User successfully created');
        this.closeSignupModal();
      })
      .catch((error) => {
        console.error('Error creating user:', error);
      });
  }
  


  approveRequest(request: ToolRequest) {
    const now = new Date(); // Current timestamp
  
    // Step 1: Update the tool request status in the toolrequests collection
    this.firestore.collection('toolrequests').doc(request.id).update({
      status: 'Approved',
      timeApproved: now,
    }).then(() => {
      console.log(`Request ${request.id} approved.`);
  
      // Step 2: Update the tool's usage details in the tools collection
      this.firestore.collection('tools').doc(request.toolID).update({
        Status: 'In Use',
        LastCheckedOutUser: request.email || 'Unknown User',
        LastCheckedOutDate: now, // Set the approval time as LastCheckedOutDate
      }).then(() => {
        console.log(`Tool ${request.toolID} updated successfully.`);
        
        // Optionally refresh the tool requests list
        this.fetchToolRequests();
      }).catch(error => {
        console.error(`Error updating tool ${request.toolID}:`, error);
      });
    }).catch(error => {
      console.error(`Error approving request ${request.id}:`, error);
    });
  }
  

  rejectRequest(request: ToolRequest) {
    this.firestore.collection('toolrequests').doc(request.id).update({ status: 'Rejected' })
      .catch(error => console.error("Error rejecting request:", error));
  }

  updateToolStatus(toolID: string, status: string) {
    this.firestore.collection('tools').doc(toolID).update({ Status: status })
      .then(() => console.log(`Tool status updated to ${status}`))
      .catch(error => console.error("Error updating tool status:", error));
  }

  getToolName(toolID: string): Observable<string> {
    return this.firestore.collection('tools').doc(toolID).valueChanges().pipe(
      map((tool: any) => tool ? tool.Name : 'Unknown Tool'),
      tap(toolName => console.log(`Fetched tool name for ${toolID}:`, toolName)),
      catchError(error => {
        console.error(`Error fetching tool name for ${toolID}:`, error);
        return of('Unknown Tool');
      })
    );
  }

  getUserEmail(userID: string): Observable<string> {
    return this.firestore.collection('users').doc(userID).valueChanges().pipe(
      map((user: any) => user ? user.email : 'Unknown Email'),
      tap(email => console.log(`Fetched email for ${userID}:`, email)),
      catchError(error => {
        console.error(`Error fetching email for ${userID}:`, error);
        return of('Unknown Email');
      })
    );
  }
}
