import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ToolUsageHistory {
  id?: string;
  Name: string;
  ModelNumber: string;
  Brand: string;
  LastCheckedOutDate?: any;
  LastCheckedOutUser?: string;
  ReturnedDate?: any;
}

@Component({
  selector: 'app-tool-usage-history',
  templateUrl: './tool-usage-history.component.html',
  styleUrls: ['./tool-usage-history.component.scss'],
})
export class ToolUsageHistoryComponent implements OnInit {
  usageHistory: ToolUsageHistory[] = [];
  usageToEdit: ToolUsageHistory | null = null;
  isEditMode = false;

  constructor(private firestore: AngularFirestore) {}

  ngOnInit(): void {
    this.fetchUsageHistory();
  }

  // Fetch tool usage history from Firestore
  fetchUsageHistory() {
    this.firestore
      .collection<ToolUsageHistory>('tools')
      .valueChanges({ idField: 'id' })
      .subscribe((data) => {
        console.log('Fetched data:', data);
        this.usageHistory = data.map((tool) => ({
          id: tool.id,
          Name: tool.Name || '',
          ModelNumber: tool.ModelNumber || '',
          Brand: tool.Brand || '',
          LastCheckedOutDate:
            tool.LastCheckedOutDate &&
            typeof tool.LastCheckedOutDate.toDate === 'function'
              ? tool.LastCheckedOutDate.toDate()
              : null,
          LastCheckedOutUser: tool.LastCheckedOutUser || '',
          ReturnedDate:
            tool.ReturnedDate &&
            typeof tool.ReturnedDate.toDate === 'function'
              ? tool.ReturnedDate.toDate()
              : null,
        }));
      });
  }

  clearReturnedDate(toolId?: string) {
    if (!toolId) {
      console.error("Tool ID is missing. Cannot clear returned date.");
      return;
    }
  
    // Update Firestore document to remove ReturnedDate
    this.firestore.collection('tools').doc(toolId).update({
      ReturnedDate: null, // Clear the returned date
      Status: 'In Use' // Reset status to 'In Use'
    })
    .then(() => {
      console.log(`Returned date cleared for tool ID: ${toolId}`);
      this.fetchUsageHistory(); // Refresh the usage history to reflect changes
    })
    .catch((error) => {
      console.error(`Error clearing returned date for tool ID: ${toolId}`, error);
    });
  }
  
  // Mark a tool as returned
 

  markAsReturned(history: ToolUsageHistory) {
    const now = new Date(); // Current date
  
    const updateData = {
      Status: 'Available',
      ReturnedDate: now, // Use a raw JavaScript Date object
    };
  
    if (history.id) {
      this.firestore
        .collection('tools')
        .doc(history.id)
        .update(updateData)
        .then(() => {
          console.log(`Tool ${history.id} marked as returned successfully.`);
          this.fetchUsageHistory();
        })
        .catch((error) => {
          console.error(`Error updating tool ${history.id}:`, error);
        });
    } else {
      console.error('Tool ID is missing for return action.');
    }
  }
  
  

  // Open modal with selected entry for editing
  editUsage(history: ToolUsageHistory) {
    this.usageToEdit = { ...history };
    this.isEditMode = true;
    console.log('Editing usage:', this.usageToEdit);
  }

  updateUsage() {
    if (this.usageToEdit && this.usageToEdit.id) {
      const lastCheckedOutDate = this.usageToEdit.LastCheckedOutDate
        ? Timestamp.fromDate(new Date(this.usageToEdit.LastCheckedOutDate))
        : null;
  
      const returnedDate = this.usageToEdit.ReturnedDate
        ? Timestamp.fromDate(new Date(this.usageToEdit.ReturnedDate))
        : null;
  
      const updateData = {
        LastCheckedOutUser: this.usageToEdit.LastCheckedOutUser || null,
        LastCheckedOutDate: lastCheckedOutDate,
        ReturnedDate: returnedDate,
      };
  
      console.log('Update Payload:', updateData);
  
      this.firestore
        .collection('tools')
        .doc(this.usageToEdit.id)
        .update(updateData)
        .then(() => {
          console.log('Document updated successfully.');
          this.closeEditModal();
          this.fetchUsageHistory();
        })
        .catch((error) => {
          console.error('Error updating document:', error);
        });
    } else {
      console.error('No tool ID provided for updating.');
    }
  }
  
  
  // Close the modal
  closeEditModal() {
    this.usageToEdit = null;
    this.isEditMode = false;
  }

  // Generate PDF report
  generatePDF() {
    const doc = new jsPDF();

    // Define the page width to calculate center alignment
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(20);
    doc.text('ONE TP ENGINEERING', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(
      'No 2-A, Jalan Siakap 10, Taman Pasir Putih, 81700 Pasir Gudang, Johor',
      pageWidth / 2,
      28,
      { align: 'center' }
    );
    doc.text(
      'Phone: 019-714 2969 | Email: onetpteam@gmail.com',
      pageWidth / 2,
      36,
      { align: 'center' }
    );

    // Add the report title centered and bold
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TOOL USAGE REPORT', pageWidth / 2, 50, { align: 'center' });

    // Define table content
    const tableBody = this.usageHistory.map((item) => [
      item.Name,
      item.ModelNumber,
      item.Brand,
      item.LastCheckedOutDate
        ? item.LastCheckedOutDate.toLocaleString()
        : '',
      item.LastCheckedOutUser,
      item.ReturnedDate ? item.ReturnedDate.toLocaleString() : '',
    ]);

    // Generate table
    (doc as any).autoTable({
      head: [
        [
          'Tool Name',
          'Model Number',
          'Brand',
          'Last Checked Out Date',
          'Last Checked Out User',
          'Returned Date',
        ],
      ],
      body: tableBody,
      startY: 60,
      styles: { halign: 'center' }, // This will center the text in the table cells if needed
    });

    // Generate the current date in DD-MM-YYYY format
    const currentDate = new Date();
    const formattedDate = `${currentDate
      .getDate()
      .toString()
      .padStart(2, '0')}-${(currentDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${currentDate.getFullYear()}`;

    // Save the PDF with the date in the filename
    doc.save(`OneTP Tools Usage Report ${formattedDate}.pdf`);
  }
}
