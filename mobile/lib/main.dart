import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'services/background_location_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await BackgroundLocationService.init();
  runApp(const ProviderScope(child: GerslApp()));
}
