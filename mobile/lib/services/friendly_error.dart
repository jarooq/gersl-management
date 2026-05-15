// =============================================================================
// friendlyError — turns DioException / network failures / generic exceptions
// into one-line human-readable text suitable for the UI.
//
// Audit found the same bug ~10 times: screens display `e.toString()` which
// produces a raw stack-trace-style message ("DioException [bad response]:
// This exception was thrown because…") that confuses field staff and leaks
// internal endpoint paths. Use friendlyError(e) anywhere we render an error
// to the user.
//
// Also exports ErrorView — the standard error state widget with a Retry
// button, so we stop using `Center(child: Text(e.toString()))` patterns.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../app/widgets.dart';

/// Map any throwable into a short human-readable message.
/// Tries to surface a server-provided `message` field when present, falls
/// back to a category-based default ("No internet", "Server error", etc.).
String friendlyError(Object? error) {
  if (error == null) return 'Something went wrong.';

  if (error is DioException) {
    // 1. Prefer the server's own message — most controllers return
    //    { success: false, message: '...' } on 4xx errors. That's the line
    //    we want the user to see (e.g. "Cannot delete: linked to project").
    final data = error.response?.data;
    if (data is Map) {
      final m = data['message'];
      if (m is String && m.trim().isNotEmpty) return m;
      // Some validators send `error: 'description'`.
      final e = data['error'];
      if (e is String && e.trim().isNotEmpty) return e;
    }

    // 2. Category fallbacks by Dio's error type.
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'The server took too long to respond. Check your connection and try again.';
      case DioExceptionType.connectionError:
        return 'No internet connection.';
      case DioExceptionType.badCertificate:
        return 'Secure connection failed.';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      case DioExceptionType.badResponse:
        final status = error.response?.statusCode;
        if (status == 401) return 'Your session has expired. Please sign in again.';
        if (status == 403) return 'You do not have permission to do that.';
        if (status == 404) return 'Not found.';
        if (status == 409) return 'Conflict — that item may already exist.';
        if (status != null && status >= 500) return 'Server error. Please try again later.';
        return 'Request failed.';
      case DioExceptionType.unknown:
        return 'Unable to reach the server.';
    }
  }

  // Common Dart exceptions surfaced from form validation / IO.
  if (error is FormatException) return 'Invalid input format.';
  if (error is TypeError)        return 'Unexpected data from the server.';
  if (error is StateError)       return 'Action could not be completed.';

  // Last resort — take the first line of toString(). Strips out the
  // multi-paragraph DioException dump so we never show stack-trace-style
  // text to the user.
  final raw = error.toString();
  final firstLine = raw.split('\n').first.trim();
  if (firstLine.isEmpty) return 'Something went wrong.';
  return firstLine.length > 160 ? '${firstLine.substring(0, 157)}…' : firstLine;
}

/// Full-screen / inline error state with an optional Retry action. Replaces
/// the `Center(child: Text(e.toString()))` pattern across the app.
class ErrorView extends StatelessWidget {
  final Object? error;
  final VoidCallback? onRetry;
  final EdgeInsetsGeometry padding;
  const ErrorView({
    super.key,
    required this.error,
    this.onRetry,
    this.padding = const EdgeInsets.all(24),
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: padding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ErrorBox(message: friendlyError(error)),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
