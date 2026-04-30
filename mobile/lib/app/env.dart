// API base URL is taken from --dart-define=API_BASE_URL at build time.
// Defaults are wired for the iOS simulator (host loopback) and Android emulator.
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3001/api',
  );
}
