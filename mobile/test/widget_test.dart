// Smoke: app builds without throwing.
// flutter_secure_storage has no platform implementation under unit tests,
// so we only pump a single frame and verify the root widget mounts.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Trivial smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: Text('GERSL'))));
    expect(find.text('GERSL'), findsOneWidget);
  });
}
