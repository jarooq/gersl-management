import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'theme.dart';
import 'widgets.dart';

// =============================================================================
// SwipeToConfirm — a slide-to-confirm pill. The user drags the thumb from the
// left edge to the right; releasing past ~80% fires onConfirmed, otherwise the
// thumb springs back. Used for "Swipe to check in" on the home dashboard.
//
// Designed to sit on a coloured banner (e.g. the blue attendance card), so the
// track is a translucent white and the thumb is solid white.
// =============================================================================

class SwipeToConfirm extends StatefulWidget {
  final String label;
  final IconData thumbIcon;
  final Future<void> Function() onConfirmed;
  final double height;
  const SwipeToConfirm({
    super.key,
    required this.label,
    required this.onConfirmed,
    this.thumbIcon = Icons.chevron_right_rounded,
    this.height = 58,
  });

  @override
  State<SwipeToConfirm> createState() => _SwipeToConfirmState();
}

class _SwipeToConfirmState extends State<SwipeToConfirm>
    with SingleTickerProviderStateMixin {
  double _dragX = 0;        // current thumb offset in px
  bool _busy = false;       // onConfirmed in flight
  bool _done = false;       // confirmed + completed

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final trackW = constraints.maxWidth;
        final thumb = widget.height - 8;
        final maxX = trackW - thumb - 8;

        void onUpdate(DragUpdateDetails d) {
          if (_busy || _done) return;
          setState(() => _dragX = (_dragX + d.delta.dx).clamp(0.0, maxX));
        }

        Future<void> onEnd(DragEndDetails _) async {
          if (_busy || _done) return;
          if (_dragX >= maxX * 0.82) {
            // Snap to the end and fire.
            setState(() { _dragX = maxX; _busy = true; });
            Haptics.success();
            try {
              await widget.onConfirmed();
              if (mounted) setState(() { _done = true; _busy = false; });
            } catch (_) {
              // Failed — spring back so the user can retry.
              if (mounted) setState(() { _dragX = 0; _busy = false; });
            }
          } else {
            setState(() => _dragX = 0); // spring back
          }
        }

        final progress = maxX == 0 ? 0.0 : (_dragX / maxX).clamp(0.0, 1.0);

        return Container(
          height: widget.height,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.16),
            borderRadius: BorderRadius.circular(widget.height / 2),
            border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Label — centred in the track space to the RIGHT of the
              // thumb so the resting thumb never sits on top of the text.
              // Fades out as the thumb advances.
              Positioned.fill(
                left: thumb + 12,
                right: 16,
                child: Center(
                  child: Opacity(
                    opacity: _done ? 1.0 : (1 - progress * 1.6).clamp(0.0, 1.0),
                    child: Text(
                      _done ? 'Checked in ✓' : widget.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: _done ? FontWeight.w800 : FontWeight.w700,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ),
              ),
              // Draggable thumb.
              AnimatedPositioned(
                duration: Duration(milliseconds: _dragX == 0 || _dragX == maxX ? 220 : 0),
                curve: Curves.easeOutBack,
                left: 4 + _dragX,
                child: GestureDetector(
                  onHorizontalDragUpdate: onUpdate,
                  onHorizontalDragEnd: onEnd,
                  child: Container(
                    width: thumb, height: thumb,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(thumb / 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.18),
                          blurRadius: 8, offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: _busy
                        ? const Padding(
                            padding: EdgeInsets.all(14),
                            child: CircularProgressIndicator(
                              strokeWidth: 2.6, color: kNavy700,
                            ),
                          )
                        : Icon(
                            _done ? Icons.check_rounded : widget.thumbIcon,
                            color: kNavy700, size: 26,
                          ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
