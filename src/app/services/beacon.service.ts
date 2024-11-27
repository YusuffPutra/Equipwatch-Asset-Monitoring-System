import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

export interface Beacon {
  id?: string;
  name: string;
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  timestamp: any; // Firestore Timestamp
}

@Injectable({
  providedIn: 'root',
})
export class BeaconService {
  constructor(private firestore: AngularFirestore) {}

  // Fetch all beacons
  getBeacons(): Observable<Beacon[]> {
    return this.firestore.collection<Beacon>('beacons').valueChanges({ idField: 'id' });
  }

  // Add a beacon
  addBeacon(beacon: Beacon): Promise<void> {
    const id = this.firestore.createId();
    return this.firestore.collection('beacons').doc(id).set(beacon);
  }

  // Update a beacon
  updateBeacon(id: string, beacon: Partial<Beacon>): Promise<void> {
    return this.firestore.collection('beacons').doc(id).update(beacon);
  }

  // Delete a beacon
  deleteBeacon(id: string): Promise<void> {
    return this.firestore.collection('beacons').doc(id).delete();
  }
}
