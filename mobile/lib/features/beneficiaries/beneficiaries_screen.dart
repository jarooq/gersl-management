// =============================================================================
// Beneficiary lookup — searchable registry used by field staff to find a
// person and see what programmes they've received across the org.
//
// Hits /api/beneficiaries with the search query. Tapping a row opens a
// detail sheet that pulls the person's programme history (WASH + IGP +
// orphan record if linked).
// =============================================================================

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/friendly_error.dart';
import '../../services/api_response.dart';

class BeneficiariesScreen extends ConsumerStatefulWidget {
  const BeneficiariesScreen({super.key});
  @override
  ConsumerState<BeneficiariesScreen> createState() => _BeneficiariesScreenState();
}

class _BeneficiariesScreenState extends ConsumerState<BeneficiariesScreen> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  List<Map<String, dynamic>> _rows = [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () => _search(q));
  }

  Future<void> _search(String q) async {
    final term = q.trim();
    if (term.length < 2) {
      setState(() { _rows = []; _error = null; });
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/beneficiaries', queryParameters: {
        'search': term, 'limit': 25,
      });
      final list = extractMapList(res.data, const ['beneficiaries', 'rows']);
      if (!mounted) return;
      setState(() { _rows = list; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      if (mounted) setState(() { _error = friendlyError(e); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Beneficiary Lookup'),
        backgroundColor: const Color(0xFF0D1D3D),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              autofocus: true,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: 'Search by name, NIC, or phone',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                isDense: true,
                suffixIcon: _searchCtrl.text.isEmpty ? null :
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () { _searchCtrl.clear(); _onChanged(''); setState(() {}); },
                  ),
              ),
              onChanged: (v) { _onChanged(v); setState(() {}); },
            ),
          ),
          if (_loading) const LinearProgressIndicator(minHeight: 2),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(6)),
                child: Text(_error!, style: TextStyle(color: Colors.red.shade800, fontSize: 12)),
              ),
            ),
          Expanded(
            child: _rows.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        _searchCtrl.text.trim().length < 2
                            ? 'Type at least 2 characters to search.'
                            : (_loading ? 'Searching…' : 'No matches.'),
                        style: TextStyle(color: Colors.grey.shade600),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : ListView.separated(
                    itemCount: _rows.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) => _BenefRow(b: _rows[i]),
                  ),
          ),
        ],
      ),
    );
  }
}

class _BenefRow extends ConsumerWidget {
  final Map<String, dynamic> b;
  const _BenefRow({required this.b});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = (b['fullName'] ?? '—').toString();
    final nic  = (b['nic'] ?? '').toString();
    final code = (b['beneficiaryId'] ?? b['id']).toString();
    final district = (b['district'] ?? '').toString();
    final phone    = (b['contactNumber'] ?? '').toString();
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: Colors.indigo.shade50,
        child: Icon(Icons.person_outline, color: Colors.indigo.shade700),
      ),
      title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(
        [if (nic.isNotEmpty) 'NIC $nic', if (district.isNotEmpty) district, if (phone.isNotEmpty) phone]
            .join(' · '),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Text('#$code', style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontFamily: 'monospace')),
      onTap: () => _open(context, ref),
    );
  }

  void _open(BuildContext context, WidgetRef ref) {
    final id = b['id'];
    if (id is! num) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _BenefDetailSheet(beneficiaryId: id.toInt(), initial: b),
    );
  }
}

class _BenefDetailSheet extends ConsumerStatefulWidget {
  final int beneficiaryId;
  final Map<String, dynamic> initial;
  const _BenefDetailSheet({required this.beneficiaryId, required this.initial});
  @override
  ConsumerState<_BenefDetailSheet> createState() => _BenefDetailSheetState();
}

class _BenefDetailSheetState extends ConsumerState<_BenefDetailSheet> {
  bool _loading = true;
  Map<String, dynamic> _detail = {};
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/beneficiaries/${widget.beneficiaryId}');
      final body = res.data;
      var data = <String, dynamic>{};
      if (body is Map && body['data'] is Map) {
        final d = Map<String, dynamic>.from(body['data'] as Map);
        data = d['beneficiary'] is Map ? Map<String, dynamic>.from(d['beneficiary'] as Map) : d;
      }
      if (!mounted) return;
      setState(() { _detail = data; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      if (mounted) setState(() { _error = friendlyError(e); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = _detail.isEmpty ? widget.initial : _detail;
    return Padding(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16,
        bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              CircleAvatar(
                backgroundColor: Colors.indigo.shade50,
                child: Icon(Icons.person, color: Colors.indigo.shade700),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text((b['fullName'] ?? '—').toString(),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  if (b['beneficiaryId'] != null)
                    Text('#${b['beneficiaryId']}',
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                ],
              )),
            ]),
            const SizedBox(height: 16),
            if (_loading) const LinearProgressIndicator(minHeight: 2),
            const SizedBox(height: 8),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(6)),
                child: Text(_error!, style: TextStyle(color: Colors.red.shade800, fontSize: 12)),
              ),
            _row('NIC',        b['nic']),
            _row('Phone',      b['contactNumber']),
            _row('Email',      b['email']),
            _row('Gender',     b['gender']),
            _row('Age',        b['age']),
            _row('District',   b['district']),
            _row('DS',         b['dsDivision']),
            _row('GN',         b['gnDivision']),
            _row('Address',    b['address']),
            const SizedBox(height: 12),
            Text(
              'Programme history for a single beneficiary will show here once '
              'the cross-programme rollup endpoint is exposed. For now, search '
              'the WASH/IGP order screens by beneficiary name.',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, dynamic value) {
    final v = (value ?? '').toString();
    if (v.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(width: 90, child: Text(label,
            style: TextStyle(color: Colors.grey.shade600, fontSize: 12))),
        Expanded(child: Text(v, style: const TextStyle(fontSize: 13))),
      ]),
    );
  }
}
