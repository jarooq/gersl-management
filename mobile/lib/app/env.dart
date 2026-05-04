// API base URL is taken from --dart-define=API_BASE_URL at build time.
// Default points to the production Vercel deployment so a release APK
// installed without --dart-define still talks to the live backend.
//
// For local development, override with:
//   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api   (Android emulator)
//   flutter run --dart-define=API_BASE_URL=http://localhost:3001/api  (iOS simulator)
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://gersl-management-jet.vercel.app/api',
  );
}
