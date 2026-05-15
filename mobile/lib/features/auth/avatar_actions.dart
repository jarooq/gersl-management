import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../services/api_client.dart';
import '../../services/friendly_error.dart';
import 'auth_controller.dart';

// =============================================================================
// pickAndUploadAvatar — staff self-service profile photo.
//
// Flow: choose camera/gallery → pick image → POST /api/upload/profile
//   → PATCH /api/users/me/avatar with the returned URL → refresh the cached
//   user so every Avatar in the app updates. Shows a snackbar on result.
// =============================================================================
Future<void> pickAndUploadAvatar(BuildContext context, WidgetRef ref) async {
  final source = await showModalBottomSheet<ImageSource>(
    context: context,
    builder: (sheetCtx) => SafeArea(
      child: Wrap(children: [
        ListTile(
          leading: const Icon(Icons.camera_alt_outlined),
          title: const Text('Take a photo'),
          onTap: () => Navigator.pop(sheetCtx, ImageSource.camera),
        ),
        ListTile(
          leading: const Icon(Icons.photo_library_outlined),
          title: const Text('Choose from gallery'),
          onTap: () => Navigator.pop(sheetCtx, ImageSource.gallery),
        ),
      ]),
    ),
  );
  if (source == null) return;

  final picked = await ImagePicker().pickImage(
    source: source,
    imageQuality: 75,
    maxWidth: 800,
  );
  if (picked == null) return;
  if (!context.mounted) return;

  final messenger = ScaffoldMessenger.of(context);
  messenger.showSnackBar(
    const SnackBar(content: Text('Uploading photo…'), duration: Duration(seconds: 2)),
  );
  try {
    final dio = ref.read(dioProvider);
    final form = FormData.fromMap({
      'image': await MultipartFile.fromFile(
        picked.path,
        filename: File(picked.path).uri.pathSegments.last,
      ),
    });
    final res = await dio.post('/upload/profile', data: form,
        options: Options(headers: {'Content-Type': 'multipart/form-data'}));
    final data = res.data['data'] ?? res.data;
    final url = (data['url'] ?? data['path'])?.toString();
    if (url == null || url.isEmpty) {
      throw Exception('Upload did not return an image URL.');
    }
    // Persist the URL on the account, then refresh the cached user.
    await dio.patch('/users/me/avatar', data: {'avatarUrl': url});
    await ref.read(authControllerProvider.notifier).updateAvatar(url);
    messenger.showSnackBar(
      const SnackBar(content: Text('Profile photo updated')),
    );
  } catch (e) {
    messenger.showSnackBar(
      SnackBar(content: Text(friendlyError(e))),
    );
  }
}
