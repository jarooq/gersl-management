import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'services/observability.dart';
import 'services/push_service.dart';

Future<void> main() async {
  await bootstrapApp(() async {
    WidgetsFlutterBinding.ensureInitialized();
    // BackgroundLocationService configures itself lazily on the first
    // start() call (punch in / manual toggle). Configuring it here at boot
    // made iOS prompt for location the instant the app opened.
    // PushService.init() is dormant when Firebase config files are missing
    // — never blocks app boot. Token registration happens after login.
    await PushService.init();
    runApp(const ProviderScope(child: GerslApp()));
  });
}
