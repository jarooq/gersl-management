// =============================================================================
// Shared constants for WASH/IGP screens — keeping stage + payment colour
// maps in one place so a UI change doesn't need three edits.
// =============================================================================

import 'package:flutter/material.dart';

const programmeStageColors = <String, Color>{
  'Ordered':      Color(0xFF94A3B8),
  'Surveyed':     Color(0xFF3B82F6),
  'Materials':    Color(0xFF6366F1),
  'Procured':     Color(0xFF6366F1),
  'Construction': Color(0xFFF59E0B),
  'Training':     Color(0xFFF59E0B),
  'Testing':      Color(0xFFA855F7),
  'Delivered':    Color(0xFF10B981),
  'HandedOver':   Color(0xFF10B981),
  'FollowUp':     Color(0xFFA855F7),
  'Reported':     Color(0xFF059669),
  'Cancelled':    Color(0xFFDC2626),
};

const programmePaymentColors = <String, Color>{
  'Paid':          Color(0xFF16A34A),
  'PartiallyPaid': Color(0xFFEA580C),
  'Pending':       Color(0xFFCA8A04),
  'Overdue':       Color(0xFFDC2626),
};
