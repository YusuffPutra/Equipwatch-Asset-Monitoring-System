import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../environments/environment';

// Initialize Firebase App
const app = initializeApp(environment.firebaseConfig);

// Export Auth instance
export const auth = getAuth(app);
