import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';
import '../../services/friendly_error.dart';
import '../auth/auth_controller.dart';

// Mobile-side safeguarding incident reporter. Field staff often see issues
// they can't or won't report from a desktop later — this lets them log it
// on the spot. Goes to the same /api/compliance/incidents endpoint as the
// admin web view, so the Compliance team sees it immediately.

const _incidentTypes = <String>[
  'Child Safeguarding',
  'Adult Safeguarding',
  'Workplace Harassment',
  'Discrimination',
  'Fraud / Financial',
  'Conflict of Interest',
  'Data Breach',
  'Health & Safety',
  'Other',
];

const _severities = <String>['Low', 'Medium', 'High', 'Critical'];

final _myIncidentsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/compliance/incidents', queryParameters: {'limit': 100});
  final raw = (res.data['data']?['incidents'] ??
                res.data['data'] ??
                res.data['incidents'] ??
                []) as List;
  return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
});

class IncidentReportScreen extends ConsumerWidget {
  const IncidentReportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(_myIncidentsProvider);

    return Scaffold(
      body: RefreshIndicator(
        color: kAmber500,
        onRefresh: () async => ref.invalidate(_myIncidentsProvider),
        child: feed.when(
          loading: () => const SkeletonList(),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [ErrorBox(message: friendlyError(e))],
          ),
          data: (rows) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _IntroBanner(),
              const SizedBox(height: 14),
              if (rows.isEmpty)
                const EmptyState(
                  title: 'No incidents reported',
                  message: 'Use the button below to file a confidential safeguarding report.',
                  icon: Icons.shield_outlined,
                )
              else
                ...rows.map((r) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _IncidentCard(row: r),
                )),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kMission500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () async {
          final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(
            builder: (_) => const _NewIncidentForm(),
          ));
          if (ok == true) ref.invalidate(_myIncidentsProvider);
        },
        icon: const Icon(Icons.add),
        label: Text('Report incident',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class _IntroBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kMission50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kMission500.withValues(alpha: 0.30)),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, color: kMission600, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'All reports are confidential and go directly to the Safeguarding team.',
              style: GoogleFonts.inter(
                fontSize: 12.5, color: kInk700, fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IncidentCard extends StatelessWidget {
  final Map<String, dynamic> row;
  const _IncidentCard({required this.row});

  @override
  Widget build(BuildContext context) {
    final severity = (row['severity'] ?? 'Low').toString();
    final status   = (row['status']   ?? 'Under Investigation').toString();
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  row['incidentType']?.toString() ?? 'Incident',
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w800, color: kInk900,
                  ),
                ),
              ),
              StatusPill(label: severity.toUpperCase(), color: _severityColor(severity)),
            ],
          ),
          const SizedBox(height: 6),
          if (row['description'] != null)
            Text(
              row['description'].toString(),
              style: GoogleFonts.inter(fontSize: 12.5, color: kInk700, height: 1.4),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.event, size: 12, color: kInk400),
              const SizedBox(width: 4),
              Text(
                _fmtDate(row['incidentDate']?.toString()),
                style: GoogleFonts.inter(fontSize: 11, color: kInk500),
              ),
              const Spacer(),
              StatusPill(label: status, color: _statusColor(status)),
            ],
          ),
        ],
      ),
    );
  }

  Color _severityColor(String s) {
    switch (s) {
      case 'Critical': return kDanger600;
      case 'High':     return kMission600;
      case 'Medium':   return kMission500;
      default:         return kInk500;
    }
  }

  Color _statusColor(String s) {
    if (s == 'Resolved' || s == 'Closed') return kSuccess600;
    if (s == 'In Progress') return kNavy900;
    return kMission500;
  }
}

String _fmtDate(String? d) {
  if (d == null) return '';
  try { return DateFormat('d MMM yyyy').format(DateTime.parse(d)); }
  catch (_) { return d; }
}

// -----------------------------------------------------------------------------

class _NewIncidentForm extends ConsumerStatefulWidget {
  const _NewIncidentForm();
  @override
  ConsumerState<_NewIncidentForm> createState() => _NewIncidentFormState();
}

class _NewIncidentFormState extends ConsumerState<_NewIncidentForm> {
  final _form = GlobalKey<FormState>();
  String _type = _incidentTypes.first;
  String _severity = 'Medium';
  DateTime _incidentDate = DateTime.now();
  final _location = TextEditingController();
  final _person = TextEditingController();
  final _description = TextEditingController();
  final _immediateAction = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _busy = true; _error = null; });
    try {
      final me = ref.read(authControllerProvider).valueOrNull?.user;
      final body = {
        'incidentType': _type,
        'severity': _severity,
        'incidentDate': DateFormat('yyyy-MM-dd').format(_incidentDate),
        'reportedDate': DateFormat('yyyy-MM-dd').format(DateTime.now()),
        'reportedBy': me?['id'],
        'location': _location.text.trim().isEmpty ? null : _location.text.trim(),
        'personInvolved': _person.text.trim().isEmpty ? null : _person.text.trim(),
        'description': _description.text.trim(),
        'immediateAction': _immediateAction.text.trim().isEmpty ? null : _immediateAction.text.trim(),
        'confidential': true,
      };
      await ref.read(dioProvider).post('/compliance/incidents', data: body);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kInk50,
      appBar: AppBar(
        title: const Text('Report incident'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          child: Form(
            key: _form,
            child: SoftCard(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: _type,
                    decoration: const InputDecoration(labelText: 'Incident type'),
                    items: [for (final t in _incidentTypes) DropdownMenuItem(value: t, child: Text(t))],
                    onChanged: (v) => setState(() => _type = v ?? _type),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _severity,
                    decoration: const InputDecoration(labelText: 'Severity'),
                    items: [for (final s in _severities) DropdownMenuItem(value: s, child: Text(s))],
                    onChanged: (v) => setState(() => _severity = v ?? _severity),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _incidentDate,
                        firstDate: DateTime.now().subtract(const Duration(days: 365)),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) setState(() => _incidentDate = picked);
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'When did this happen?'),
                      child: Text(DateFormat('d MMM yyyy').format(_incidentDate)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _location,
                    decoration: const InputDecoration(labelText: 'Location (optional)'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _person,
                    decoration: const InputDecoration(labelText: 'Person involved (optional)'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _description,
                    minLines: 4, maxLines: 8,
                    decoration: const InputDecoration(
                      labelText: 'What happened?',
                      hintText: 'Describe in your own words…',
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Description is required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _immediateAction,
                    minLines: 2, maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Immediate action taken (optional)',
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    ErrorBox(message: _error!),
                  ],
                  const SizedBox(height: 18),
                  GlowButton(
                    label: _busy ? 'Submitting…' : 'Submit confidential report',
                    icon: Icons.shield_outlined,
                    loading: _busy,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
