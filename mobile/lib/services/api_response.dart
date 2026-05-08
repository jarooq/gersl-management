// =============================================================================
// API response helpers — defensive extractors that don't blow up when the
// backend response shape rotates.
//
// Why: `value as List?` does NOT silently null-out when value is a non-null
// non-List (e.g. a Map). It throws a TypeError. So fallback chains like
//   final raw = (res.data['data'] as List?) ??
//               (res.data['list']  as List?) ?? [];
// crash the moment res.data['data'] is something like { items: [...] }.
//
// extractList() walks the response with `is List` / `is Map` checks instead,
// so it handles all of:
//   { data: [...] }                       (legacy flat shape)
//   { data: { <key>: [...], pagination: ... } }
//   { <key>: [...] }                       (some endpoints flatten by mistake)
// =============================================================================

/// Extract a list payload from a typical API response. Returns const [] when no
/// shape matches — never throws on shape mismatch. `innerKeys` is the ordered
/// list of plausible nested-array names (e.g. `['movements']`, `['claims']`,
/// `['notifications']`).
List extractList(dynamic body, [List<String> innerKeys = const []]) {
  if (body is! Map) return const [];

  final data = body['data'];
  if (data is List) return data;
  if (data is Map) {
    for (final k in innerKeys) {
      final v = data[k];
      if (v is List) return v;
    }
    // Some endpoints nest as data.rows
    final rows = data['rows'];
    if (rows is List) return rows;
  }

  // Top-level fallback (a few endpoints just put the array under their own key).
  for (final k in innerKeys) {
    final v = body[k];
    if (v is List) return v;
  }
  final rows = body['rows'];
  if (rows is List) return rows;

  return const [];
}

/// Same idea for a single-object response. Tries data → data.<innerKey> →
/// top-level. Returns null when nothing matches.
Map<String, dynamic>? extractMap(dynamic body, [List<String> innerKeys = const []]) {
  if (body is! Map) return null;
  final data = body['data'];
  if (data is Map) {
    for (final k in innerKeys) {
      final v = data[k];
      if (v is Map) return Map<String, dynamic>.from(v);
    }
    return Map<String, dynamic>.from(data);
  }
  for (final k in innerKeys) {
    final v = body[k];
    if (v is Map) return Map<String, dynamic>.from(v);
  }
  return null;
}

/// Convenience: walks extractList, then casts each element to Map<String,dynamic>.
List<Map<String, dynamic>> extractMapList(dynamic body, [List<String> innerKeys = const []]) {
  final raw = extractList(body, innerKeys);
  return raw
      .whereType<Map>()
      .map((m) => Map<String, dynamic>.from(m))
      .toList();
}
