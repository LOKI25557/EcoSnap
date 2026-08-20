# Google Maps & Geolocation Architecture

This document describes the setup, required APIs, environment variables, permissions, and provider architecture for the Google Maps and Geolocation integration in EcoSnap.

---

## 1. Environment Configuration & API Keys

To configure Google Maps, ensure you have a Google Maps API Key with the required APIs enabled.

### Required Google Cloud APIs:
1. **Maps SDK for Android** (for Android app)
2. **Maps SDK for iOS** (for iOS app)

### Secure Key Configuration:
To prevent committing API keys to git, EcoSnap uses a dynamic Expo configuration system:
- The static config `app.json` is wrapped by `app.config.js`.
- The API key is read from the local environment variable `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Update your local `.env` file with your API key:
  ```env
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
  ```
- `.env` files are ignored in `.gitignore` to prevent leakage.

---

## 2. Location Permissions

EcoSnap follows location privacy guidelines. We do not track users automatically or persist precise user locations unnecessarily.

### Core Permission Behavior:
1. **No Auto-prompting:** Permissions are NOT requested automatically by services (e.g. `getCurrentLocation()`).
2. **Explicit UI Triggers:** The user must explicitly request action on the UI (such as loading the map) to check or ask for location permissions.
3. **Graceful Failures:** If permissions are denied or blocked (user chose "Never Ask Again"), the map falls back to a default region (San Francisco center) rather than crashing or locking the app.

---

## 3. Provider Architecture for Facility Search

We implement a decoupled provider pattern for facility searches. This ensures the app doesn't hardcode client-side Google Places API calls or expose server secrets in the mobile code.

```
                  MapScreen
                      │
                      ▼
               facilityService
                      │
             ┌────────┴────────┐
             ▼                 ▼
  LocalFacilityProvider  FirestoreFacilityProvider
     (Mock/Static Data)      (Production DB)
```

- **`FacilityProvider` Interface:** Defines the contract for fetching nearby facilities based on latitude, longitude, radius, and type.
- **`LocalFacilityProvider`:** Reads static local data (San Francisco region), simulating network delays. Used for offline compatibility and testing.
- **`FirestoreFacilityProvider`:** Queries the root level `facilities` collection in Firestore.

---

## 4. Privacy & Data Integrity

1. **Reporter Privacy:** When mapping community reports on the map, only user-facing details (type, description, status, creation date, approximate address) are exposed. Authentication IDs, emails, and phone numbers are hidden.
2. **Coordinate Validation:** All coordinate handling processes validate that latitudes are in `[-90, 90]` and longitudes are in `[-180, 180]` to avoid corrupting map rendering or failing external maps navigation handoff.
3. **External Navigation Handoff:** Universal map schemes (`maps://` for iOS and `google.navigation:q=` for Android) are dynamically selected and validated to securely hand off turn-by-turn navigation to native mapping apps without custom routing overhead.
