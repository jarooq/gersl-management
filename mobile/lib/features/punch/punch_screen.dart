import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PunchScreen extends ConsumerWidget {
  const PunchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Punch screen — coming up in commit 3.\nAttendance In/Out with selfie + GPS lands here.',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
