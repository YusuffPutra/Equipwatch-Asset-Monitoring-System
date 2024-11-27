import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth.service';

interface Tool {
  id?: string;
  Name: string;
  ModelNumber: string;
  Brand: string;
  Status: string;
  Location?: string;
  Category?: string;
  Condition?: string;
}

interface ToolRequest {
  id: string;
  userID: string;
  toolID: string;
  status: string;
  timereq: any;
}

@Component({
  selector: 'app-view-tool',
  templateUrl: './view-tool.component.html',
  styleUrls: ['./view-tool.component.scss']
})
export class ViewToolComponent implements OnInit {
  tools$: Observable<Tool[]>;
  filteredTools: Tool[] = [];
  searchTerm: string = '';
  userRequests: ToolRequest[] = [];
  currentUserID: string | null = null;
  toolsList: Tool[] = [];
  
  // New variables for popup form
  showRequestForm: boolean = false;
  selectedTool: Tool | null = null;
  requestEmail: string = '';
  requestReason: string = '';

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {
    this.tools$ = this.firestore.collection<Tool>('tools').valueChanges({ idField: 'id' });
    this.tools$.subscribe(tools => {
      this.filteredTools = tools;
      this.toolsList = tools;
    });
  }

  ngOnInit(): void {
    this.authService.getCurrentUserID().then(userID => {
      this.currentUserID = userID;
      if (this.currentUserID) {
        this.fetchUserRequests();
      }
    });
  }

  applySearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredTools = this.toolsList.filter(tool =>
      tool.Name.toLowerCase().includes(term) ||
      (tool.ModelNumber && tool.ModelNumber.toLowerCase().includes(term)) ||
      (tool.Brand && tool.Brand.toLowerCase().includes(term)) ||
      (tool.Status && tool.Status.toLowerCase().includes(term)) ||
      (tool.Location && tool.Location.toLowerCase().includes(term))
    );
  }

  // Open the request form and set the selected tool
  openRequestForm(tool: Tool) {
    this.selectedTool = tool;
    this.showRequestForm = true;
  }

  // Close the request form and reset inputs
  closeRequestForm() {
    this.showRequestForm = false;
    this.selectedTool = null;
    this.requestEmail = '';
    this.requestReason = '';
  }

  // Submit the request with email and reason
  submitRequest() {
    if (this.selectedTool && this.currentUserID && this.requestEmail && this.requestReason) {
      const customId = `REQ-${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}`;
      
      console.log("Submitting request with ID:", customId);
      console.log("Selected Tool:", this.selectedTool);
      console.log("User ID:", this.currentUserID);
      console.log("Email:", this.requestEmail);
      console.log("Reason:", this.requestReason);
  
      this.firestore.collection('toolrequests').doc(customId).set({
        id: customId,
        userID: this.currentUserID,
        email: this.requestEmail,
        toolID: this.selectedTool.id,
        toolName: this.selectedTool.Name,
        reason: this.requestReason,
        status: 'Pending',
        timereq: new Date()
      }).then(() => {
        console.log("Request submitted successfully with custom ID:", customId);
        this.fetchUserRequests();
        this.closeRequestForm();
      }).catch(error => {
        console.error("Error submitting request: ", error);
      });
    } else {
      console.error("Form fields are incomplete. Please fill all required fields.");
    }
  }

  fetchUserRequests() {
    if (this.currentUserID) {
      this.firestore.collection<ToolRequest>('toolrequests', ref =>
        ref.where('userID', '==', this.currentUserID)
      ).valueChanges({ idField: 'id' }).subscribe(requests => {
        this.userRequests = requests.map(request => ({
          ...request,
          timereq: request.timereq ? request.timereq.toDate() : null // Convert Firestore Timestamp to JS Date
        }));
      });
    }
  }

  getRequestStatus(toolID: string | undefined): string | null {
    const request = this.userRequests.find(req => req.toolID === (toolID ?? ''));
    return request ? request.status : null;
  }

  getToolName(toolID: string | undefined): string {
    const tool = this.toolsList.find(t => t.id === toolID);
    return tool ? tool.Name : 'Unknown Tool';
  }

  clearRequestHistory() {
    if (this.currentUserID) {
      this.userRequests.forEach(request => {
        this.firestore.collection('toolrequests').doc(request.id).delete();
      });
      this.userRequests = []; // Clear local history after deletion
    }
  }
}
