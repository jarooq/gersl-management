import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

// =============================================================================
// Observability — thin wrapper around Sentry.
//
// Sentry is initialised on app boot via `bootstrapApp()` below. Pass the DSN at
// build time:
//   flutter build apk --dart-define=SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<id>
//
// If no DSN is provided (e.g. local dev builds), Sentry stays uninitialised and
// every captureException/breadcrumb call is a cheap no-op — the app still runs
// normally. Set `--dart-define=ENV=staging|production` to tag events.
// =============================================================================

const _sentryDsn = String.fromEnvironment('SENTRY_DSN');
const _envName   = String.fromEnvironment('ENV', defaultValue: 'development');

bool get isObservabilityEnabled => _sentryDsn.isNotEmpty;

/// Wraps `runApp` so any uncaught Flutter framework, isolate, or async-zone
/// error is forwarded to Sentry. Falls back to plain runApp when no DSN is set.
Future<void> bootstrapApp(Future<void> Function() runner) async {
  if (!isObservabilityEnabled) {
    if (kDebugMode) {
      debugPrint('observability: SENTRY_DSN not set — running without crash reporting');
    }
    await runner();
    return;
  }

  await SentryFlutter.init(
    (options) {
      options.dsn = _sentryDsn;
      options.environment = _envName;
      options.tracesSampleRate = 0.05; // light perf sampling
      options.attachStacktrace = true;
      options.enableAutoSessionTracking = true;
      // Don't ship the user's PII in events.
      options.sendDefaultPii = false;
    },
    appRunner: () async {
      // Flutter framework errors (build/layout/paint).
      FlutterError.onError = (details) {
        Sentry.captureException(
          details.exception,
          stackTrace: details.stack,
          hint: Hint.withMap({'flutter_error_silent': details.silent}),
        );
        // Still surface in console so devs see it locally.
        FlutterError.presentError(details);
      };
      // Errors raised on platform-isolate boundary (plugin errors etc.).
      PlatformDispatcher.instance.onError = (error, stack) {
        Sentry.captureException(error, stackTrace: stack);
        return true;
      };
      await runner();
    },
  );
}

// Public helpers — call these from anywhere; they're cheap no-ops without DSN.

void captureError(Object error, [StackTrace? stack, Map<String, dynamic>? extra]) {
  if (!isObservabilityEnabled) return;
  Sentry.captureException(
    error,
    stackTrace: stack,
    hint: extra == null ? null : Hint.withMap(extra),
  );
}

void breadcrumb(String message, {String? category, Map<String, dynamic>? data}) {
  if (!isObservabilityEnabled) return;
  Sentry.addBreadcrumb(Breadcrumb(
    message: message,
    category: category,
    data: data,
    level: SentryLevel.info,
  ));
}

void setUserContext({int? id, String? email, String? role}) {
  if (!isObservabilityEnabled) return;
  Sentry.configureScope((scope) {
    scope.setUser(SentryUser(
      id: id?.toString(),
      email: email,
      data: { 'role': ?role },
    ));
  });
}

void clearUserContext() {
  if (!isObservabilityEnabled) return;
  Sentry.configureScope((scope) => scope.setUser(null));
}
