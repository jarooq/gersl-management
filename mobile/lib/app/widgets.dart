import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'theme.dart';

// =============================================================================
// Haptics — small wrapper so tap interactions feel native (iOS + Android).
// =============================================================================
abstract class Haptics {
  static void light()  { HapticFeedback.lightImpact(); }
  static void medium() { HapticFeedback.mediumImpact(); }
  static void select() { HapticFeedback.selectionClick(); }
  static void success(){ HapticFeedback.lightImpact(); }
}

// =============================================================================
// Reusable building blocks for the GERSL mobile design system.
// Mirrors the admin-web primitives (Card / Badge / PageHeader / Button) so
// mobile and web read as one product family.
// =============================================================================

/// Soft white card with hairline border + neutral shadow.
class SoftCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final double radius;
  const SoftCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.color,
    this.radius = 14,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      decoration: BoxDecoration(
        color: color ?? kSurfaceLight,
        borderRadius: BorderRadius.circular(radius == 14 ? 20 : radius),
        border: Border.all(color: kBorderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Padding(padding: padding, child: child),
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        borderRadius: BorderRadius.circular(radius),
        onTap: onTap,
        child: card,
      ),
    );
  }
}

/// Frosted-glass card, used over gradients / hero blocks.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final double blur;
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius = 14,
    this.blur = 18,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.22),
              width: 1.0,
            ),
          ),
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

/// Tiny rounded status pill — used everywhere for state labels.
class StatusPill extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;
  const StatusPill({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  factory StatusPill.tone(String label, PillToneSpec tone, {IconData? icon}) =>
      StatusPill(label: label, color: tone.color, icon: icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.22), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

class PillToneSpec {
  final Color color;
  const PillToneSpec(this.color);
}

abstract class PillTone {
  static const PillToneSpec neutral = PillToneSpec(kInk500);
  static const PillToneSpec brand   = PillToneSpec(kNavy900);
  static const PillToneSpec success = PillToneSpec(kSuccess600);
  static const PillToneSpec warn    = PillToneSpec(kMission500);
  static const PillToneSpec danger  = PillToneSpec(kDanger600);
  static const PillToneSpec mission = PillToneSpec(kMission600);
}

/// Primary CTA pill on a navy / dark background — uses the mission-amber accent.
class GlowButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final double height;
  final bool loading;
  const GlowButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.height = 50,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: kMission500,
        boxShadow: [
          BoxShadow(
            color: kMission500.withValues(alpha: 0.25),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: loading ? null : onPressed,
          child: SizedBox(
            height: height,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (loading) ...[
                  const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4, color: kNavy900,
                    ),
                  ),
                  const SizedBox(width: 12),
                ] else if (icon != null) ...[
                  Icon(icon, color: kNavy900, size: 18),
                  const SizedBox(width: 10),
                ],
                Text(
                  label,
                  style: GoogleFonts.inter(
                    color: kNavy900,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Decorative blurred coloured "blob" — use behind hero text to add depth.
class GradientBlob extends StatelessWidget {
  final double size;
  final List<Color> colors;
  const GradientBlob({super.key, this.size = 220, required this.colors});

  @override
  Widget build(BuildContext context) {
    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(colors: colors),
        ),
      ),
    );
  }
}

/// Renders text with a brand gradient.
class GradientText extends StatelessWidget {
  final String text;
  final TextStyle style;
  final Gradient? gradient;
  const GradientText(this.text,
      {super.key, required this.style, this.gradient});

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (rect) =>
          (gradient ?? kBrandGradient).createShader(rect),
      child: Text(text, style: style),
    );
  }
}

/// Compact uppercase section heading + optional trailing widget.
class SectionHeader extends StatelessWidget {
  final String label;
  final Widget? trailing;
  const SectionHeader({super.key, required this.label, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 2),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label.toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.0,
                color: kInk500,
              ),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Canonical mobile page hero — navy band, mission-amber eyebrow + icon.
/// Mirrors the admin-web `<PageHeader>` primitive.
class MobilePageHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? eyebrow;
  final IconData? icon;
  final List<Widget> actions;
  const MobilePageHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.eyebrow,
    this.icon,
    this.actions = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      decoration: BoxDecoration(
        color: kNavy900,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: kNavy900.withValues(alpha: 0.18),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                HeaderIconChip(icon: icon!),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (eyebrow != null)
                      Text(
                        eyebrow!.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.1,
                          color: kMission300,
                        ),
                      ),
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                        letterSpacing: -0.3,
                        color: Colors.white,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: kInk200,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 14),
            Wrap(spacing: 8, runSpacing: 8, children: actions),
          ],
        ],
      ),
    );
  }
}

/// Standard inline error box (matches admin web `ErrorBox`).
class ErrorBox extends StatelessWidget {
  final String message;
  final EdgeInsetsGeometry margin;
  const ErrorBox({super.key, required this.message, this.margin = EdgeInsets.zero});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kDanger600.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kDanger600.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: kDanger600, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(
                fontSize: 12.5, color: kDanger600, fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Standard empty-state card (matches admin web `EmptyState`).
class EmptyState extends StatelessWidget {
  final String title;
  final String? message;
  final IconData icon;
  final Widget? action;
  const EmptyState({
    super.key,
    required this.title,
    this.message,
    this.icon = Icons.inbox_outlined,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 28),
      child: Column(
        children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: kInk100,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: kInk400, size: 26),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14.5, fontWeight: FontWeight.w800, color: kInk900,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 4),
            Text(
              message!,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12.5, color: kInk500, height: 1.4),
            ),
          ],
          if (action != null) ...[
            const SizedBox(height: 14),
            action!,
          ],
        ],
      ),
    );
  }
}

/// Centered loading spinner card (for `AsyncValue.loading`).
class LoadingPanel extends StatelessWidget {
  const LoadingPanel({super.key});
  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(child: CircularProgressIndicator(color: kNavy900)),
      );
}

/// Drop-in replacement for the placeholder icon in [MobilePageHeader].
/// Use [MobilePageHeader] without an icon and prepend this manually if needed.
class HeaderIconChip extends StatelessWidget {
  final IconData icon;
  const HeaderIconChip({super.key, required this.icon});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40, height: 40,
      decoration: BoxDecoration(
        color: kMission500.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kMission500.withValues(alpha: 0.30)),
      ),
      child: Icon(icon, color: kMission300, size: 20),
    );
  }
}

// =============================================================================
// SkeletonBox — shimmering placeholder for async list loads. Looks far more
// modern than CircularProgressIndicator.
// =============================================================================
class SkeletonBox extends StatefulWidget {
  final double height;
  final double? width;
  final double radius;
  final EdgeInsetsGeometry margin;
  const SkeletonBox({
    super.key,
    this.height = 14,
    this.width,
    this.radius = 6,
    this.margin = EdgeInsets.zero,
  });

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))
        ..repeat();

  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: widget.margin,
      height: widget.height,
      width: widget.width ?? double.infinity,
      decoration: BoxDecoration(
        color: kInk100, borderRadius: BorderRadius.circular(widget.radius),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(widget.radius),
        child: AnimatedBuilder(
          animation: _c,
          builder: (_, _) {
            final t = _c.value;
            return ShaderMask(
              blendMode: BlendMode.srcATop,
              shaderCallback: (rect) => LinearGradient(
                begin: Alignment(-1.0 + t * 2.0, 0),
                end:   Alignment( 0.0 + t * 2.0, 0),
                colors: [
                  Colors.white.withValues(alpha: 0.0),
                  Colors.white.withValues(alpha: 0.55),
                  Colors.white.withValues(alpha: 0.0),
                ],
                stops: const [0.0, 0.5, 1.0],
              ).createShader(rect),
              child: Container(color: kInk100),
            );
          },
        ),
      ),
    );
  }
}

/// Pre-baked skeleton row that matches the SoftCard list rows.
class SkeletonListCard extends StatelessWidget {
  const SkeletonListCard({super.key});
  @override
  Widget build(BuildContext context) {
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              SkeletonBox(height: 36, width: 36, radius: 9),
              SizedBox(width: 12),
              Expanded(child: SkeletonBox(height: 14, width: 140)),
              SizedBox(width: 8),
              SkeletonBox(height: 18, width: 56, radius: 999),
            ],
          ),
          const SizedBox(height: 12),
          const SkeletonBox(height: 11, width: 220),
          const SizedBox(height: 6),
          const SkeletonBox(height: 11, width: 160),
        ],
      ),
    );
  }
}

class SkeletonList extends StatelessWidget {
  final int count;
  final EdgeInsetsGeometry padding;
  const SkeletonList({super.key, this.count = 5, this.padding = const EdgeInsets.all(12)});
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: padding,
      itemCount: count,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, _) => const SkeletonListCard(),
    );
  }
}

// =============================================================================
// KpiPill — compact at-a-glance stat used on the Home dashboard.
// =============================================================================
class KpiPill extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color tone;
  final VoidCallback? onTap;
  const KpiPill({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    this.tone = kNavy900,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: kSurfaceLight,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap == null ? null : () { Haptics.light(); onTap!(); },
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            border: Border.all(color: kBorderLight),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 14, offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: tone.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: tone),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      value,
                      style: GoogleFonts.inter(
                        fontSize: 17, fontWeight: FontWeight.w800,
                        color: kInk900, letterSpacing: -0.4, height: 1.1,
                      ),
                    ),
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 11, color: kInk500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// QuickAction — large tappable tile for the Home dashboard quick-actions row.
// =============================================================================
class QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? tone;
  final bool primary;
  const QuickAction({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.tone,
    this.primary = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = primary ? kMission500 : kSurfaceLight;
    final fg = primary ? kNavy900 : (tone ?? kInk900);
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () { Haptics.light(); onTap(); },
        borderRadius: BorderRadius.circular(14),
        child: Container(
          height: 76,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            border: primary ? null : Border.all(color: kInk100),
            borderRadius: BorderRadius.circular(14),
            boxShadow: primary
                ? [
                    BoxShadow(
                      color: kMission500.withValues(alpha: 0.25),
                      blurRadius: 14, offset: const Offset(0, 6),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: kInk900.withValues(alpha: 0.04),
                      blurRadius: 10, offset: const Offset(0, 3),
                    ),
                  ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: fg, size: 22),
              const SizedBox(height: 5),
              Text(
                label,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  color: fg, fontSize: 11.5,
                  fontWeight: FontWeight.w700, height: 1.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// ActivityRow — compact timeline-style row for the recent-activity feed.
// =============================================================================
class ActivityRow extends StatelessWidget {
  final IconData icon;
  final Color tone;
  final String title;
  final String subtitle;
  final String time;
  final VoidCallback? onTap;
  const ActivityRow({
    super.key,
    required this.icon,
    required this.tone,
    required this.title,
    required this.subtitle,
    required this.time,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap == null ? null : () { Haptics.light(); onTap!(); },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: tone.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 15, color: tone),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 13, fontWeight: FontWeight.w700, color: kInk900,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                time,
                style: GoogleFonts.inter(fontSize: 11, color: kInk400),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// SearchFilterBar — sticky search field + filter chips header.
// =============================================================================
class SearchFilterBar extends StatelessWidget {
  final String hint;
  final ValueChanged<String> onSearch;
  final List<String> filters;
  final String? selectedFilter;
  final ValueChanged<String?>? onFilterChange;
  const SearchFilterBar({
    super.key,
    required this.hint,
    required this.onSearch,
    this.filters = const [],
    this.selectedFilter,
    this.onFilterChange,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
      decoration: BoxDecoration(
        color: kInk50,
        border: Border(bottom: BorderSide(color: kInk100, width: 1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: kSurfaceLift,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorderLight),
            ),
            child: Row(
              children: [
                const Icon(Icons.search, size: 18, color: kInk400),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    onChanged: onSearch,
                    decoration: InputDecoration(
                      hintText: hint,
                      hintStyle: GoogleFonts.inter(color: kInk400, fontSize: 13.5),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      isDense: true,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (filters.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 30,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: filters.length,
                separatorBuilder: (_, _) => const SizedBox(width: 6),
                itemBuilder: (_, i) {
                  final f = filters[i];
                  final selected = (selectedFilter ?? filters.first) == f;
                  return Material(
                    color: selected ? kAmber500 : kSurfaceLift,
                    borderRadius: BorderRadius.circular(999),
                    child: InkWell(
                      onTap: () { Haptics.select(); onFilterChange?.call(f); },
                      borderRadius: BorderRadius.circular(999),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(999),
                          border: selected ? null : Border.all(color: kBorderLight),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          f,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: selected ? kNavy900 : kInk700,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// =============================================================================
// AppSheet — convenient bottom-sheet wrapper with drag handle + safe area.
// Use to open new-form flows (Visit / Expense / Leave / Advance / Incident).
// =============================================================================
Future<T?> showAppSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  String? title,
  bool fullHeight = true,
}) {
  Haptics.light();
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.42),
    builder: (ctx) => DraggableScrollableSheet(
      initialChildSize: fullHeight ? 0.92 : 0.6,
      minChildSize:     fullHeight ? 0.6  : 0.3,
      maxChildSize:     0.96,
      expand: false,
      builder: (_, scroll) => Container(
        decoration: const BoxDecoration(
          color: kInk50,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            // Drag handle
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: kInk200, borderRadius: BorderRadius.circular(2),
              ),
            ),
            if (title != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 17, fontWeight: FontWeight.w800, color: kInk900,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      icon: const Icon(Icons.close, color: kInk500, size: 20),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: PrimaryScrollController(
                  controller: scroll,
                  child: builder(ctx),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

// =============================================================================
// AccountSheet — slide-up sheet from app-bar avatar tap. Identity + GPS toggle
// + sign-out (replaces the cluttered app bar actions).
// =============================================================================
class AccountSheet extends StatelessWidget {
  final String name;
  final String? role;
  final String initials;
  final bool tracking;
  final VoidCallback onToggleTracking;
  final VoidCallback onSignOut;

  const AccountSheet({
    super.key,
    required this.name,
    required this.initials,
    required this.tracking,
    required this.onToggleTracking,
    required this.onSignOut,
    this.role,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 22),
        decoration: const BoxDecoration(
          color: kInk50,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: kInk200, borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 18),
            // Identity card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: kNavy900, borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Container(
                    width: 46, height: 46,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: kMission500.withValues(alpha: 0.18),
                      border: Border.all(color: kMission500.withValues(alpha: 0.30)),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Text(
                      initials,
                      style: GoogleFonts.inter(
                        color: kMission300, fontWeight: FontWeight.w800, fontSize: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                          style: GoogleFonts.inter(
                            color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15,
                          ), overflow: TextOverflow.ellipsis,
                        ),
                        if (role != null)
                          Text(role!,
                            style: GoogleFonts.inter(color: kInk200, fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            _SheetTile(
              icon: tracking ? Icons.gps_fixed : Icons.gps_off,
              tone: tracking ? kSuccess600 : kInk500,
              label: tracking ? 'GPS tracking on' : 'GPS tracking off',
              hint:  tracking ? 'Tap to stop' : 'Tap to enable',
              onTap: () { Haptics.medium(); onToggleTracking(); Navigator.of(context).pop(); },
            ),
            const SizedBox(height: 8),
            _SheetTile(
              icon: Icons.logout_rounded,
              tone: kDanger600,
              label: 'Sign out',
              hint:  'End this session',
              onTap: () { Haptics.medium(); onSignOut(); Navigator.of(context).pop(); },
            ),
          ],
        ),
      ),
    );
  }
}

class _SheetTile extends StatelessWidget {
  final IconData icon;
  final Color tone;
  final String label;
  final String hint;
  final VoidCallback onTap;
  const _SheetTile({
    required this.icon,
    required this.tone,
    required this.label,
    required this.hint,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      child: Row(
        children: [
          Container(
            width: 38, height: 38,
            decoration: BoxDecoration(
              color: tone.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: tone, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                  style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w700, color: kInk900),
                ),
                Text(hint,
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: kInk400, size: 20),
        ],
      ),
    );
  }
}
