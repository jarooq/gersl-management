// =============================================================================
// ScanQueue — offline-first persistence for distribution QR scans.
//
// Distribution sites are frequently out of coverage, so a scan must NEVER be
// lost just because the POST failed. Every scan that can't reach the server
// is written to a local sqflite table and replayed later (manual "Sync now"
// or the app-resume hook in app.dart).
//
// Idempotency: each scan carries a client-generated UUID v4 (client_uuid).
// The backend dedupes on it (`POST /distribution-scans` returns 200 with the
// existing row on retry), so replaying the queue after a half-failed flush
// can never double-count a beneficiary. Locally the column is UNIQUE with
// INSERT OR IGNORE for the same reason.
// =============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

class ScanQueue {
  static const _dbName = 'gersl_scan_queue.db';
  static const _table = 'pending_scans';
  static const _uuid = Uuid();

  Database? _db;

  /// Lazily open (and create) the database. Safe to call repeatedly — the
  /// handle is cached after the first open.
  Future<Database> _database() async {
    final cached = _db;
    if (cached != null && cached.isOpen) return cached;
    final dir = await getDatabasesPath();
    final db = await openDatabase(
      p.join(dir, _dbName),
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE $_table (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            client_uuid TEXT NOT NULL UNIQUE,
            event_id    INTEGER NOT NULL,
            token       TEXT NOT NULL,
            latitude    REAL,
            longitude   REAL,
            notes       TEXT,
            queued_at   TEXT NOT NULL,
            last_error  TEXT,
            retry_count INTEGER NOT NULL DEFAULT 0
          )
        ''');
      },
    );
    _db = db;
    return db;
  }

  /// Persist a scan for later sync. Generates a fresh client UUID when the
  /// caller doesn't supply one (callers normally DO supply it, so the same
  /// uuid used for the failed live POST is reused — keeping the server-side
  /// dedupe airtight). Returns the client_uuid of the queued row.
  Future<String> enqueue({
    required String token,
    required int eventId,
    double? latitude,
    double? longitude,
    String? notes,
    String? clientUuid,
  }) async {
    final db = await _database();
    final uuid = (clientUuid == null || clientUuid.isEmpty)
        ? _uuid.v4()
        : clientUuid;
    await db.insert(
      _table,
      {
        'client_uuid': uuid,
        'event_id': eventId,
        'token': token,
        'latitude': latitude,
        'longitude': longitude,
        'notes': notes,
        'queued_at': DateTime.now().toIso8601String(),
        'retry_count': 0,
      },
      // Re-enqueueing the same scan (double-tap, retry race) is a no-op.
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
    return uuid;
  }

  /// All rows still waiting to sync, oldest first.
  Future<List<Map<String, Object?>>> pending() async {
    final db = await _database();
    return db.query(_table, orderBy: 'id ASC');
  }

  /// Remove a row that the server has accepted (2xx — or 409 duplicate,
  /// which means the beneficiary is already recorded and the row is moot).
  Future<void> markSynced(String clientUuid) async {
    final db = await _database();
    await db.delete(_table, where: 'client_uuid = ?', whereArgs: [clientUuid]);
  }

  /// Record a failed sync attempt: stores the error text and bumps
  /// retry_count so stuck rows are diagnosable.
  Future<void> markFailed(String clientUuid, String err) async {
    final db = await _database();
    await db.rawUpdate(
      'UPDATE $_table SET last_error = ?, retry_count = retry_count + 1 '
      'WHERE client_uuid = ?',
      // Cap stored error text — Dio messages can be paragraphs long.
      [err.length > 500 ? err.substring(0, 500) : err, clientUuid],
    );
  }

  /// Number of scans still waiting to sync (drives the badge on the scan
  /// screen header).
  Future<int> count() async {
    final db = await _database();
    final rows = await db.rawQuery('SELECT COUNT(*) AS c FROM $_table');
    return Sqflite.firstIntValue(rows) ?? 0;
  }
}

final scanQueueProvider = Provider<ScanQueue>((ref) => ScanQueue());
