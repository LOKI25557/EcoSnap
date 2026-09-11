# EcoSnap & Segregate

**Tagline:** Snap. Sort. Sustain.

## Project Overview
EcoSnap is an AI-powered smart waste management and recycling assistant that helps users identify waste materials, segregate them correctly, track environmental impact, locate recycling facilities, request waste pickups, and learn sustainable waste management practices.

## Major Features
- **AI Waste Detection:** On-device TensorFlow Lite classification for rapid waste identification.
- **Smart Assistant:** Personalized AI recycling guidance, disposal steps, and environmental impact insights.
- **Sustainability Dashboard:** Track your eco points, goals, achievements, and complete weekly challenges.
- **Offline-First Architecture:** Core functionality remains fully operational without internet access. Data is stored safely on the device.
- **Maps & Recycling Centers:** Interactive map functionality to locate nearby recycling facilities.

## Architecture & AI Pipeline
The application leverages an offline-first architecture with React Native and Expo (SDK 51). 
The AI Pipeline utilizes `react-native-fast-tflite` for loading `mobilenet_v1_1.0_224_quant.tflite` natively on the device, ensuring high-performance image inference without requiring external API calls.

## Privacy & Data Storage
EcoSnap stores user data strictly on the device to maximize user privacy.
- **What is stored:** Detection history, profile configurations, sustainability statistics, completed achievements, current goals, and points.
- **Where it is stored:** Data is stored locally via `AsyncStorage` and Expo's `FileSystem`.
- **Data retention:** Data remains indefinitely until explicitly cleared by the user.
- **Data leaving the device:** User data never leaves the device automatically. Users may manually trigger backups or JSON exports using the native system sharing sheet.
- **User Control:** Users can clear all history, and reset statistics directly from the settings page.

## Permissions
- **Camera:** Required for scanning waste. If denied, users cannot utilize the core AI scanner.
- **Location:** Required to calculate distances to recycling centers. If denied, the app falls back to an offline/manual maps mode.
- **Notifications:** Used for eco-reminders. If denied, push notifications gracefully fail.

## Setup & Development Commands
1. Clone the repository
2. Navigate to `/mobile-app`: `cd mobile-app`
3. Install dependencies: `npm install`
4. Launch development server: `npm start` or `npx expo start`

## Validation Commands
- Type-checking: `npm run ts:check`
- Testing: `npm run test`
- Expo `npx expo-doctor`

## Production Status
- **Validation State:** Static TypeScript validation passes, automated Jest tests pass, and Expo Doctor passes.
- **Deployment:** Production EAS configuration exists.
- **Physical Device Validation:** The latest validation pass utilized static code analysis and automated tools in a local environment. Comprehensive physical device testing and end-to-end final production EAS build validation may still be required prior to deployment.

## Branch Strategy
- `main` - Production ready code
- `develop` - Integration branch for all features
- `feature/*` - Individual feature branches
