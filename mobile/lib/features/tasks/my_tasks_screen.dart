import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MyTasksScreen extends ConsumerWidget {
  const MyTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'My Tasks — coming up in commit 3.\nWill render /api/tasks/my-tasks here.',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
