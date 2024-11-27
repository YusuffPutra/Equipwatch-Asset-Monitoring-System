import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

interface Tool {
  id?: string;
  Name: string;
  Status: string;
  Location: string;
  Category?: string;
  Condition?: string;
  Brand?: string;
  ModelNumber?: string;
  LastCheckedOutDate?: any; // Default to null
  LastCheckedOutUser?: string; // Default to "N/A" or an empty string
  ReturnedDate?: any; // Default to null
}

@Component({
  selector: 'app-manage-tools',
  templateUrl: './manage-tools.component.html',
  styleUrls: ['./manage-tools.component.scss']
})
export class ManageToolsComponent implements OnInit {
  tools$: Observable<Tool[]>;  // Observable to store tools data
  allTools: Tool[] = [];       // Original list of all tools from Firestore
  filteredTools: Tool[] = [];  // Store filtered and sorted tools
  searchTerm: string = '';      // For search input
  sortBy: string = 'Name';      // Default sort field

  // Initialize currentTool with default values for each field
  currentTool: Tool = { 
    Name: '', 
    Status: '', 
    Location: '', 
    LastCheckedOutDate: null, 
    LastCheckedOutUser: 'N/A', 
    ReturnedDate: null 
  };

  toolToEdit: Tool | null = null;
  isEditMode = false;

  constructor(private firestore: AngularFirestore) {
    // Fetch tools from Firestore and initialize filteredTools
    this.tools$ = this.firestore.collection<Tool>('tools').valueChanges({ idField: 'id' });
    this.tools$.subscribe(tools => {
      this.allTools = tools; // Store original list of tools
      this.filteredTools = [...this.allTools]; // Initialize filtered tools with all tools
      this.applySearchAndSort();
    });
  }

  ngOnInit(): void {}

  // Apply search and sort every time input changes
  applySearchAndSort() {
    let tools = [...this.allTools]; // Use original list of tools

    // Apply search filter
    if (this.searchTerm) {
      tools = tools.filter(tool =>
        tool.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    tools.sort((a, b) => {
      const fieldA = a[this.sortBy as keyof Tool] || '';
      const fieldB = b[this.sortBy as keyof Tool] || '';
      return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
    });

    this.filteredTools = tools;
  }

  // Call applySearchAndSort on search input change
  onSearchChange() {
    this.applySearchAndSort();
  }

  // Trigger sorting when dropdown selection changes
  sortTools() {
    this.applySearchAndSort();
  }

  // Reset search term and filtered tools list
  clearSearch() {
    this.searchTerm = '';
    this.filteredTools = [...this.allTools]; // Reset filtered tools to all tools
    this.applySearchAndSort(); // Re-apply sorting if any
  }

  // Save a new tool, ensuring all fields are initialized
  saveNewTool() {
    const toolWithDefaults = {
      ...this.currentTool,
      LastCheckedOutDate: this.currentTool.LastCheckedOutDate || null,
      LastCheckedOutUser: this.currentTool.LastCheckedOutUser || 'N/A',
      ReturnedDate: this.currentTool.ReturnedDate || null
    };

    this.firestore.collection('tools').add(toolWithDefaults).then(() => {
      this.resetForm();
    }).catch(error => console.error("Error adding tool: ", error));
  }

  // Update an existing tool
  updateTool() {
    if (this.toolToEdit && this.toolToEdit.id) {
      this.firestore.collection('tools').doc(this.toolToEdit.id).update(this.toolToEdit)
        .then(() => this.closeEditModal())
        .catch(error => console.error("Error updating tool: ", error));
    }
  }

  // Open edit modal with selected tool
  editTool(tool: Tool) {
    this.toolToEdit = { ...tool };
    this.isEditMode = true;
  }

  // Delete tool
  deleteTool(id: string | undefined) {
    if (id) {
      this.firestore.collection('tools').doc(id).delete()
        .catch(error => console.error("Error deleting tool: ", error));
    } else {
      console.error("Tool ID is undefined");
    }
  }

  // Close edit modal
  closeEditModal() {
    this.toolToEdit = null;
    this.isEditMode = false;
  }

  // Reset the "Add Tool" form with default values for each field
  resetForm() {
    this.currentTool = { 
      Name: '', 
      Status: '', 
      Location: '', 
      LastCheckedOutDate: null, 
      LastCheckedOutUser: 'N/A', 
      ReturnedDate: null 
    };
  }
}
