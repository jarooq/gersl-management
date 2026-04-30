import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gersl_mobile/app/app.dart';

void main() {
  testWidgets('App boots and lands on Login when unauthenticated',
      (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: GerslApp()));
    // Initial frame may render a CircularProgressIndicator while the auth
    // controller resolves; pumpAndSettle drives it to the login screen.
    await tester.pumpAndSettle(const Duration(seconds: 2));

    expect(find.text('Sign in'), findsOneWidget);
  });
}
