# System Architecture

## Mobile App Layer
Built with React Native and Expo. Handles the user interface, camera input, location services, and local state management. Uses React Navigation for routing.

## AI Layer
TensorFlow Lite models deployed on the device for fast, offline waste identification. The `/ai-engine` directory contains the scripts for training and evaluating these models before export.

## Firebase Layer
Provides backend services including:
- **Authentication:** User login and management.
- **Firestore:** NoSQL database for user profiles, waste logs, and community reports.
- **Storage:** Storing uploaded images.
- **Cloud Functions:** Server-side logic for complex operations (e.g., scoring, notifications).

## Maps Layer
Integration with Google Maps API to show nearby recycling facilities and allow users to schedule or track waste pickups.

## Community Layer
Features for users to report illegal dumping, share recycling tips, and compete on leaderboards. Data is managed via Firestore and moderated through Cloud Functions.
