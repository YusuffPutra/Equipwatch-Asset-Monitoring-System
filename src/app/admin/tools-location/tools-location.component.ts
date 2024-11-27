/// <reference types="web-bluetooth" />

import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BleService } from '../../services/ble.service'; // Import BLE Service

// Interfaces for Beacons and Tools
interface Beacon {
  id: string;
  name: string;
  uuid: string;
  rssi: number;
  timestamp: Date;
  connectionStatus: string; // For connection status ("Connected", "Out of Range")
  status: string; // For assignment status ("Assigned", "Available")
  assignedTool?: string;
}

interface Tool {
  id: string;
  Name: string;
  Status: string; // "Assigned" or "Available"
  Location: string;
  Category: string;
  ModelNumber?: string;
  Brand?: string;
  beaconID?: string | null;
}

@Component({
  selector: 'app-tools-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tools-location.component.html',
  styleUrls: ['./tools-location.component.scss'],
})
export class ToolsLocationComponent implements OnInit, OnDestroy {
  private pollingInterval: any; // Store the polling interval
  beacons: Beacon[] = []; // List of beacons
  tools: Tool[] = []; // List of tools
  outOfRangeBeacons: Beacon[] = []; // Beacons currently out of range
  selectedBeacon: Beacon | null = null; // Selected beacon for assigning
  selectedTool: Tool | null = null; // Selected tool for assigning
  rssiThreshold: number = -90; // Threshold for geofencing
  showModal: boolean = false; // Modal visibility flag

  constructor(
    private firestore: AngularFirestore,
    private bleService: BleService // Inject BLE Service
  ) {}
  
  private audio: HTMLAudioElement | null = null; // Audio instance for alert sound
  ngOnInit(): void {
    this.audio = new Audio('/assets/sounds/amber-alert.mp3'); // Initialize audio
    this.audio.loop = true; // Enable looping for continuous alert sound
    
    // Fetch existing beacons from Firestore
    this.firestore
      .collection('beacons')
      .snapshotChanges()
      .subscribe((snapshot) => {
        this.beacons = snapshot.map((doc) => {
          const data = doc.payload.doc.data() as Omit<Beacon, 'id' | 'timestamp'>;
          const id = doc.payload.doc.id;
          const timestamp = doc.payload.doc.get('timestamp')?.toDate(); // Convert Firestore Timestamp to JS Date
          return { id, ...data, timestamp } as Beacon;
        });
        this.updateOutOfRangeBeacons(); // Update geofence alerts after fetching data
        console.log('Beacons fetched from Firestore:', this.beacons);
      });

    // Fetch tools data
    this.firestore
      .collection('tools')
      .snapshotChanges()
      .subscribe((snapshot) => {
        this.tools = snapshot.map((doc) => {
          const data = doc.payload.doc.data() as Omit<Tool, 'id'>;
          const id = doc.payload.doc.id;
          return { id, ...data };
        });

        this.updateToolStatus();
      });
  }

  ngOnDestroy(): void {
    // Stop RSSI polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      console.log('Polling interval cleared.');
    }

    // Stop any currently playing sound
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log('Audio stopped.');
    }
  }
/**
 * Trigger BLE scanning on user action.
 */
async scanForBeaconDevices(): Promise<void> {
  try {
    const device = await this.bleService.scanForDevices();
    if (device) {
      const server = await this.bleService.connectToDevice(device);
      if (server) {
        console.log('Connected to GATT Server:', server);

        // Start polling for real-time RSSI updates
        this.pollRSSI(device);

        // Fetch beacon data
        const beaconData: Partial<Beacon> = {
          uuid: device.name || 'Unknown Beacon',
          rssi: 0, // Example RSSI (will be updated dynamically)
          name: device.name || 'Unknown Beacon',
          connectionStatus: 'Connected', // Set initial connection status
          status: 'Available', // Keep assignment status separate
          timestamp: new Date(),
        };

        // Check if the beacon exists in Firestore
        const beaconSnapshot = await this.firestore
          .collection('beacons')
          .ref.where('name', '==', beaconData.name)
          .get();

        if (!beaconSnapshot.empty) {
          // Update existing beacon with real-time data
          beaconSnapshot.forEach((doc) => {
            this.firestore.collection('beacons').doc(doc.id).update({
              rssi: beaconData.rssi,
              timestamp: new Date(),
              connectionStatus: 'Connected',
            });
          });
        } else {
          // Add new beacon to Firestore
          const docRef = await this.firestore.collection('beacons').add(beaconData);
          beaconData.id = docRef.id;
        }

        console.log('Beacon data synchronized with Firestore:', beaconData);
      }
    }
  } catch (error) {
    console.error('Error during BLE scanning:', error);
  }
}

/**
 * Poll RSSI for a connected device and update Firestore in real time.
 */
private pollRSSI(device: BluetoothDevice): void {
  const POLL_INTERVAL = 1000; // Poll every 200ms for near real-time updates
  const TIMEOUT_THRESHOLD = 500; // 0.5 seconds timeout for "Out of Range"
  const beaconName = device.name || 'Unknown Beacon';
  const lastUpdateTimes: Record<string, number> = {}; // Tracks last update times

  const intervalId = setInterval(async () => {
    const currentTime = Date.now();

    try {
      const simulatedRSSI = Math.floor(Math.random() * -30 - 40); // Replace with actual RSSI logic

      const beaconSnapshot = await this.firestore
        .collection('beacons')
        .ref.where('name', '==', beaconName)
        .get();

      if (!beaconSnapshot.empty) {
        beaconSnapshot.forEach((doc) => {
          const beaconId = doc.id;

          // Update last update time
          lastUpdateTimes[beaconId] = currentTime;

          // Update Firestore with RSSI and connection status
          this.firestore.collection('beacons').doc(beaconId).update({
            rssi: simulatedRSSI,
            timestamp: new Date(),
            connectionStatus: simulatedRSSI < this.rssiThreshold ? 'Out of Range' : 'Connected',
          });

          // Update local beacons array
          const beacon = this.beacons.find((b) => b.id === beaconId);
          if (beacon) {
            beacon.rssi = simulatedRSSI;
            beacon.timestamp = new Date();
            beacon.connectionStatus = simulatedRSSI < this.rssiThreshold ? 'Out of Range' : 'Connected';
          }
        });
      }

      // Check for beacons that haven't updated within the timeout period
      Object.keys(lastUpdateTimes).forEach((beaconId) => {
        if (currentTime - lastUpdateTimes[beaconId] > TIMEOUT_THRESHOLD) {
          console.log(`Beacon ${beaconId} is out of range due to no updates.`);

          // Mark as "Out of Range" in Firestore
          this.firestore.collection('beacons').doc(beaconId).update({
            connectionStatus: 'Out of Range',
          });

          // Update local beacons array
          const beacon = this.beacons.find((b) => b.id === beaconId);
          if (beacon) {
            beacon.connectionStatus = 'Out of Range';
          }
        }
      });

      this.updateOutOfRangeBeacons();
    } catch (error) {
      console.error('Error during RSSI polling:', error);
      clearInterval(intervalId);
    }
  }, POLL_INTERVAL);

  device.addEventListener('gattserverdisconnected', () => {
    clearInterval(intervalId);
    console.log(`Disconnected from ${beaconName}, stopped RSSI polling.`);

    // Handle disconnection by marking the beacon as "Out of Range"
    const disconnectedBeacon = this.beacons.find((b) => b.name === beaconName);
    if (disconnectedBeacon) {
      this.firestore.collection('beacons').doc(disconnectedBeacon.id).update({
        connectionStatus: 'Out of Range',
      });

      disconnectedBeacon.connectionStatus = 'Out of Range';
      this.updateOutOfRangeBeacons();
    }
  });
}
public soundEnabled: boolean = false; // Track if sound alerts are enabled

// Toggle sound alerts
public toggleSound(): void {
  this.soundEnabled = !this.soundEnabled;
  console.log(this.soundEnabled ? 'Sound alerts enabled.' : 'Sound alerts disabled.');

  // Stop audio immediately if sound is disabled
  if (!this.soundEnabled && this.audio) {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

public updateOutOfRangeBeacons(): void {
  const previousOutOfRange = this.outOfRangeBeacons.map((b) => b.id);

  // Update the list of out-of-range beacons
  this.outOfRangeBeacons = this.beacons.filter(
    (beacon) => beacon.connectionStatus === 'Out of Range'
  );

  console.log('Out-of-range beacons:', this.outOfRangeBeacons);

  // Check if there are new out-of-range beacons
  const newOutOfRange = this.outOfRangeBeacons.filter(
    (beacon) => !previousOutOfRange.includes(beacon.id)
  );

  // Play alert sound if there are new out-of-range beacons and sound is enabled
  if (newOutOfRange.length > 0 && this.soundEnabled && this.audio) {
    this.audio.play().catch((error) => {
      console.error('Error playing alert sound:', error);
    });
  }

  // Stop the sound if no beacons are out of range
  if (this.outOfRangeBeacons.length === 0 && this.audio) {
    this.audio.pause();
    this.audio.currentTime = 0; // Reset audio playback
  }
}



dismissAlert(beacon: Beacon): void {
  if (this.audio) {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  // Find and remove the dismissed alert
  const index = this.outOfRangeBeacons.findIndex((b) => b.id === beacon.id);
  if (index !== -1) {
    this.outOfRangeBeacons.splice(index, 1); // Remove from the array
  }

  // Stop the sound if no more alerts
  if (this.outOfRangeBeacons.length === 0 && this.audio) {
    this.audio.pause(); // Stop the audio
    this.audio.currentTime = 0; // Reset audio playback to the beginning
  }

  console.log(`Dismissed alert for beacon: ${beacon.name}`);
}


private updateToolStatus(): void {
  this.tools.forEach((tool) => {
    const assignedBeacon = this.beacons.find((beacon) => beacon.assignedTool === tool.id);
    tool.Status = assignedBeacon ? 'Assigned' : 'Available';
  });
}

openAssignModal(beacon: Beacon): void {
  if (beacon.status === 'Assigned') {
    alert(`Beacon "${beacon.name}" is already assigned to Tool "${beacon.assignedTool}".`);
    return;
  }
  this.selectedBeacon = beacon;
  this.showModal = true;
}

closeModal(): void {
  this.showModal = false;
  this.selectedBeacon = null;
  this.selectedTool = null;
}

assignBeaconToTool(tool: Tool): void {
  if (this.selectedBeacon && tool) {
    this.firestore
      .collection('tools')
      .doc(tool.id)
      .update({ beaconID: this.selectedBeacon.id, Status: 'Assigned' })
      .then(() => {
        this.firestore
          .collection('beacons')
          .doc(this.selectedBeacon!.id)
          .update({ status: 'Assigned', assignedTool: tool.id })
          .then(() => {
            alert(`Beacon "${this.selectedBeacon!.name}" assigned to Tool "${tool.Name}" successfully.`);
            this.updateToolStatus();
            this.closeModal();
          })
          .catch((error) => {
            console.error('Error updating beacon:', error);
          });
      })
      .catch((error) => {
        console.error('Error assigning beacon to tool:', error);
      });
  } else {
    alert('Please select a valid tool and beacon.');
  }
}

deassignBeacon(beacon: Beacon): void {
  if (beacon && beacon.id) {
    const tool = this.tools.find((t) => t.id === beacon.assignedTool);

    this.firestore
      .collection('beacons')
      .doc(beacon.id)
      .update({ status: 'Available', assignedTool: null })
      .then(() => {
        if (tool) {
          this.firestore
            .collection('tools')
            .doc(tool.id)
            .update({ beaconID: null, Status: 'Available' });
        }
        alert(`Beacon "${beacon.name}" has been de-assigned successfully.`);
        this.updateToolStatus();
      })
      .catch((error) => {
        console.error('Error de-assigning beacon:', error);
      });
  } else {
    alert('Unable to de-assign. Please check the beacon details.');
  }
}
}
