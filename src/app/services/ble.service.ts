/// <reference types="web-bluetooth" />

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BleService {
  private readonly SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; // Replace with your service UUID
  private readonly NOTIFY_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  /**
   * Request Bluetooth Device
   * Allows the user to select a Bluetooth device with the appropriate service UUID.
   */
  async scanForDevices(): Promise<BluetoothDevice | null> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [this.SERVICE_UUID],
      });
      console.log('Device selected:', device);
      return device;
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        console.warn('No device selected by the user.');
      } else {
        console.error('Error during BLE scan:', error);
      }
      return null;
    }
  }

  /**
   * Connect to GATT Server on Device
   * Establishes a connection to the selected device's GATT server.
   */
  async connectToDevice(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer | null> {
    try {
      if (!device.gatt) {
        console.error('GATT server not available on device:', device);
        return null;
      }
      const server = await device.gatt.connect();
      console.log('Connected to GATT server:', server);
      return server || null;
    } catch (error) {
      console.error('Error connecting to device:', error);
      return null;
    }
  }

  /**
   * Start Notifications
   * Enables notifications for a characteristic and sets up a callback to handle incoming data.
   */
  async startNotifications(
    server: BluetoothRemoteGATTServer,
    serviceUUID: string,
    characteristicUUID: string,
    callback: (value: DataView) => void
  ): Promise<void> {
    try {
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (target.value) {
          callback(target.value);
        }
      });
      console.log(`Notifications started for characteristic [${characteristicUUID}].`);
    } catch (error) {
      console.error('Error starting notifications:', error);
    }
  }

  /**
   * Read RSSI Value from Beacon
   * A placeholder method for reading RSSI values. Replace with device-specific implementation if available.
   */
  async readRSSI(device: BluetoothDevice): Promise<number> {
    try {
      // Example: Simulate RSSI as fluctuating random values (replace with actual RSSI logic if supported by your device)
      const simulatedRSSI = Math.floor(Math.random() * -30 - 40); // Random RSSI between -40 and -70
      console.log(`Simulated RSSI for ${device.name}: ${simulatedRSSI}`);
      return simulatedRSSI;
    } catch (error) {
      console.error('Error reading RSSI:', error);
      return -100; // Default out-of-range value
    }
  }

  /**
   * Disconnect from GATT Server
   * Disconnects from the device's GATT server if connected.
   */
  disconnectDevice(device: BluetoothDevice): void {
    try {
      if (device.gatt?.connected) {
        device.gatt.disconnect();
        console.log('Device disconnected:', device);
      } else {
        console.log('Device is already disconnected.');
      }
    } catch (error) {
      console.error('Error disconnecting device:', error);
    }
  }
}
