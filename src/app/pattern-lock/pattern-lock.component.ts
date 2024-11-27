import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import * as CryptoJS from 'crypto-js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

interface UserData {
  pattern?: string;
}

@Component({
  selector: 'app-pattern-lock',
  templateUrl: './pattern-lock.component.html',
  styleUrls: ['./pattern-lock.component.scss'],
})
export class PatternLockComponent implements OnInit {
  grid: boolean[] = new Array(9).fill(false); // Represents the 3x3 grid
  selectedPattern: number[] = []; // Stores the selected cells
  savedPattern: string | null = null; // To store the saved pattern
  confirmPattern: string | null = null; // For confirmation during setup
  errorMessage: string = ''; // Error message for the user
  successMessage: string = ''; // Success message for the user
  isDrawing: boolean = false; // Tracks if the user is actively drawing a pattern
  currentUserId: string | null = null; // Stores the authenticated user ID

  constructor(private firestore: AngularFirestore, private router: Router) {}

  ngOnInit(): void {
    this.checkAuthentication(); // Check if the user is authenticated
  }

  checkAuthentication(): void {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUserId = user.uid;
        console.log('User authenticated. UID:', this.currentUserId);
        this.retrievePatternFromFirebase(); // Retrieve pattern if the user is authenticated
      } 
    }, 
    (error) => {
      console.error('Error in onAuthStateChanged:', error);
    });
  }

  startDrawing(): void {
    this.isDrawing = true;
    this.clearGrid(); // Clear the grid before starting
  }

  hoverCell(index: number): void {
    if (this.isDrawing && !this.selectedPattern.includes(index)) {
      this.selectedPattern.push(index);
      this.grid[index] = true; // Highlight the cell
    }
  }

  selectCell(index: number): void {
    if (!this.isDrawing) return;
  
    if (!this.selectedPattern.includes(index)) {
      console.log(`Selected cell ${index}`);
      this.selectedPattern.push(index);
      this.grid[index] = true; // Highlight the cell
    }
  }
    

  stopDrawing(): void {
    this.isDrawing = false;
    const pattern = this.selectedPattern.join('-'); // Convert the pattern to a string

    if (!this.savedPattern) {
      // New User: Create and confirm pattern
      if (!this.confirmPattern) {
        this.confirmPattern = pattern;
        this.successMessage = 'Please redraw the pattern to confirm.';
        this.errorMessage = '';
      } else if (this.confirmPattern === pattern) {
        this.savedPattern = pattern;
        this.savePatternToFirebase(pattern); // Save pattern to Firestore
        this.successMessage = 'Pattern saved successfully!';
        this.errorMessage = '';
        this.confirmPattern = null;
        this.redirectToEmailVerification(); // Redirect to email verification
      } else {
        this.errorMessage = 'Patterns do not match. Please try again.';
        this.successMessage = '';
        this.confirmPattern = null;
      }
    } else if (this.savedPattern === pattern) {
      // Existing User: Verify pattern
      this.successMessage = 'Pattern matched!';
      this.errorMessage = '';
      this.redirectToEmailVerification(); // Redirect to email verification
    } else {
      this.errorMessage = 'Pattern does not match. Try again.';
      this.successMessage = '';
    }

    this.clearGrid();
  }

  clearGrid(): void {
    this.grid.fill(false);
    this.selectedPattern = [];
  }

  savePatternToFirebase(pattern: string): void {
    if (this.currentUserId) {
      const encryptedPattern = CryptoJS.AES.encrypt(pattern, environment.encryptionKey).toString();

      this.firestore
        .collection('users')
        .doc(this.currentUserId)
        .set({ pattern: encryptedPattern, patternSet: true }, { merge: true })
        .then(() => console.log('Pattern saved in Firebase.'))
        .catch((error) => console.error('Error saving pattern to Firebase:', error));
    } else {
      console.error('Cannot save pattern. User is not authenticated.');
    }
  }

  retrievePatternFromFirebase(): void {
    if (this.currentUserId) {
      this.firestore
        .collection('users')
        .doc(this.currentUserId)
        .get()
        .subscribe(
          (doc) => {
            const data = doc.data() as UserData | undefined;
            const encryptedPattern = data?.pattern;
  
            if (encryptedPattern) {
              try {
                const bytes = CryptoJS.AES.decrypt(encryptedPattern, environment.encryptionKey);
                this.savedPattern = bytes.toString(CryptoJS.enc.Utf8);
                console.log('Decrypted pattern retrieved:', this.savedPattern);
              } catch (error) {
                console.error('Error decrypting pattern:', error);
                this.errorMessage = 'Failed to decrypt pattern. Please reset your pattern.';
              }
            } else {
              this.promptUserToSetPattern();
            }
          },
          (error) => {
            console.error('Error retrieving pattern from Firebase:', error);
            this.errorMessage = 'Failed to retrieve pattern. Please try again later.';
          }
        );
    } else {
      console.error('User not authenticated. Cannot retrieve pattern.');
    }
  }

  clearPattern(): void {
    this.clearGrid(); // Resets the grid cells and selected pattern
    this.errorMessage = ''; // Clear any error messages
    this.successMessage = ''; // Clear any success messages
  }

  promptUserToSetPattern(): void {
    this.errorMessage = 'No pattern found. Please set a new pattern.';
    this.successMessage = '';
    this.savedPattern = null;
    this.clearGrid();
  }

  redirectToEmailVerification(): void {
    console.log('Redirecting to email verification...');
    this.router.navigate(['/email-verification']);
  }
}
