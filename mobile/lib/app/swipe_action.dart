import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'theme.dart';
import 'widgets.dart';

// =============================================================================
// SwipeToConfirm — a slide-to-confirm pill. The user drags the thumb from the
// left edge to the right; releasing past ~80% fires onConfirmed, otherwise the
// thumb springs back. Used for "Swipe to check in" on the home dashboard.
//
// After onConfirmed completes the thumb always springs back to the start, so
// the control is reusable — important because the home "swipe to check in"
// just launches the punch flow; when the user returns to Home the slider must
// be ready to use again (Flutter reuses the State across rebuilds, so it
// can't be left stuck at the end).
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

class _SwipeToConfirmState extends State<SwipeToConfirm> {
  double _dragX = 0;   // current thumb offset in px
  bool _busy = false;  // onConfirmed in flight
  bool _snapping = false; // true while the thumb is animating to a rest point

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final trackW = constraints.maxWidth;
        final thumb = widget.height - 8;
        final maxX = (trackW - thumb - 8).clamp(0.0, double.infinity);

        void onUpdate(DragUpdateDetails d) {
          if (_busy) return;
          setState(() {
            _snapping = false;
            _dragX = (_dragX + d.delta.dx).clamp(0.0, maxX);
          });
        }

        Future<void> onEnd(DragEndDetails _) async {
          if (_busy) return;
          if (maxX > 0 && _dragX >= maxX * 0.82) {
            // Snap to the end and fire the action. We deliberately do NOT
            // await onConfirmed: when it launches navigation (e.g. opening
            // the punch screen) its future only resolves if the user pops
            // back — leave via the bottom-nav tab instead and it never
            // resolves, which used to leave the thumb stuck at the end.
            // Instead we always spring back after a short feedback delay,
            // so the slider is reusable no matter how the user navigates.
            setState(() { _dragX = maxX; _snapping = true; _busy = true; });
            Haptics.success();
            try {
              // ignore: discarded_futures
              widget.onConfirmed();
            } catch (_) { /* fire-and-forget */ }
            await Future<void>.delayed(const Duration(milliseconds: 550));
            if (mounted) {
              setState(() { _dragX = 0; _snapping = true; _busy = false; });
            }
          } else {
            setState(() { _dragX = 0; _snapping = true; }); // spring back
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
              // Label — centred in the track space to the RIGHT of the thumb
              // so the resting thumb never sits on the text. Fades as the
              // thumb advances.
              Positioned.fill(
                left: thumb + 12,
                right: 16,
                child: Center(
                  child: Opacity(
                    opacity: (1 - progress * 1.6).clamp(0.0, 1.0),
                    child: Text(
                      widget.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ),
              ),
              // Draggable thumb. It animates only while snapping to a rest
              // point — during an active drag it tracks the finger 1:1.
              AnimatedPositioned(
                duration: Duration(milliseconds: _snapping ? 240 : 0),
                curve: Curves.easeOut,
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
                        : Icon(widget.thumbIcon, color: kNavy700, size: 26),
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
