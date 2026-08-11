# EcoSnap Release Migration Plan

## Current State
- **Expo SDK:** 49.0.15
- **React Native:** 0.72.10
- **Android Target API:** 33 (Google Play Store requires 34+)

## Target State
- **Expo SDK:** 51.0.0 (or 50.0.0 if 51 presents breaking issues)
- **React Native:** 0.74.x (or 0.73.x)
- **Android Target API:** 34

## Affected Packages
- `expo-camera`: Will upgrade to corresponding SDK 51 version.
- `expo-location`, `expo-notifications`, `expo-sharing`, `expo-file-system`, `expo-asset`: Will upgrade to corresponding SDK 51 versions.
- `react-native-maps`: Needs to match SDK 51's bundled version.
- `react-native-fast-tflite`: Supported on RN 0.73/0.74 but requires verification to ensure the underlying JSI layer remains compatible with the new RN version.
- `jest-expo` and `ts-jest`: Needs to be updated to match SDK 51. This should resolve the Babel polyfill syntax error currently failing tests.

## Migration Risks
1. **TensorFlow Lite Compatibility**: `react-native-fast-tflite` utilizes JSI. Changes in React Native 0.73/0.74 might affect C++ bindings. We will verify its compilation.
2. **Camera API Changes**: `expo-camera` might have minor API changes in newer SDKs (e.g. `Camera` vs `CameraView`). If so, we will adapt `CameraScreen.tsx` without changing the overall user workflow.
3. **Automated Testing**: Jest's babel preset must correctly align with React Native 0.74's polyfills.

## Expected Breaking Changes
- `expo-camera` might introduce the `CameraView` component instead of `Camera`.
- Android target bump to 34 requires granular media permissions, though we don't request media. Location might require foreground service changes if background tracking was used (we only use foreground).

## Rollback Strategy
If `npx expo-doctor` fails fundamentally or `ts:check` fails due to insurmountable native incompatibilities:
1. Revert `package.json` to the current state (stored in git).
2. Run `npm install` to restore `node_modules`.
