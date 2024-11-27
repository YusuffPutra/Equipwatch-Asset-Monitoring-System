import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: AngularFirestore) { }

  // Method to get all documents from a collection
  getCollectionData(collectionPath: string): Observable<any[]> {
    return this.firestore.collection(collectionPath).valueChanges();
  }

  // Method to add a document to a collection
  addDocument(collectionPath: string, data: any): Promise<any> {
    return this.firestore.collection(collectionPath).add(data);
  }

  // Method to update a document
  updateDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    return this.firestore.collection(collectionPath).doc(docId).update(data);
  }

  // Method to delete a document
  deleteDocument(collectionPath: string, docId: string): Promise<void> {
    return this.firestore.collection(collectionPath).doc(docId).delete();
  }
}
