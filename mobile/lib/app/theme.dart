import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// =============================================================================
// GERSL mobile design — LIGHT PASTEL theme (2026 home-redesign).
//
//   Page bg:     kBgLight   (#F4F5FB) — soft cool lavender-grey
//   Card:        kSurface   (#FFFFFF)
//   Primary txt: kInk900    (#15203C) — deep navy ink
//   Hero band:   kBrandGradient — navy → indigo → bright blue
//   Accent CTA:  kAmber500  (#F8B834) — warm amber
//   Tile tints:  pink / lavender / sky / mint / peach / cream pastels
//
// Token NAMES are unchanged so every screen keeps compiling — only the
// VALUES are light. Screens that use tokens follow automatically.
// =============================================================================

// --- LIGHT SURFACE PALETTE -----------------------------------------------
const Color kBgLight        = Color(0xFFF4F5FB); // page background
const Color kSurfaceLight   = Color(0xFFFFFFFF); // cards / panels
const Color kSurfaceLift    = Color(0xFFF8F9FD); // raised / hover surface
const Color kBorderLight    = Color(0xFFE8EAF3); // hairline borders
const Color kBorderSofter   = Color(0xFFEEF0F7);

// Ink scale — dark text on light surfaces.
const Color kInk900 = Color(0xFF15203C); // primary text — deep navy
const Color kInk800 = Color(0xFF27324F);
const Color kInk700 = Color(0xFF3C4868);
const Color kInk500 = Color(0xFF737F9E); // muted / secondary text
const Color kInk400 = Color(0xFF9AA4BE); // hint / tertiary text
const Color kInk200 = Color(0xFFE4E7F0); // chip bg / divider
const Color kInk100 = Color(0xFFF0F2F8); // lighter chip bg
const Color kInk50  = kBgLight;

// --- BRAND NAVY → INDIGO → BLUE (hero gradient) --------------------------
const Color kNavy900 = Color(0xFF15203C); // deep navy — primary
const Color kNavy800 = Color(0xFF273A86); // indigo mid
const Color kNavy700 = Color(0xFF3B5BDB); // bright blue end
const Color kNavy50  = Color(0xFFE9ECFA); // pale indigo tint

// --- AMBER ACCENT (warm CTA) ---------------------------------------------
const Color kAmber500 = Color(0xFFF8B834);
const Color kAmber600 = Color(0xFFE0A41A);
const Color kAmber300 = Color(0xFFFCD58F);
const Color kAmber50  = Color(0xFFFEF6E3);

// --- ELECTRIC GLOW ACCENTS (kept for highlights) -------------------------
const Color kGlowCyan   = Color(0xFF2BB7D9);
const Color kGlowViolet = Color(0xFF6B4CD1);

// --- PASTEL TILE TONES (Quick-Action grid + KPIs) ------------------------
const Color kKpiPinkBg     = Color(0xFFFDE4EC);
const Color kKpiPinkInk    = Color(0xFFE5447D);
const Color kKpiCreamBg    = Color(0xFFFEF0D6);
const Color kKpiCreamInk   = Color(0xFFD8930F);
const Color kKpiMintBg     = Color(0xFFDDF4E6);
const Color kKpiMintInk    = Color(0xFF1FA463);
const Color kKpiSkyBg      = Color(0xFFE0ECFE);
const Color kKpiSkyInk     = Color(0xFF2F6BE0);
const Color kKpiPurpleBg   = Color(0xFFE9E4FC);
const Color kKpiPurpleInk  = Color(0xFF6B4CD1);

// --- STATUS COLOURS ------------------------------------------------------
const Color kSuccess600 = Color(0xFF1FA463);
const Color kDanger600  = Color(0xFFE5484D);
const Color kWarn600    = Color(0xFFD8930F);

// --- WEEKLY-DONUT SLICE COLOURS (Attendance screen) ----------------------
const Color kDotPresent = Color(0xFF1FA463);
const Color kDotExDelay = Color(0xFFF8B834);
const Color kDotAbsent  = Color(0xFFE5484D);
const Color kDotLeave   = Color(0xFF6B4CD1);
const Color kDotVisit   = Color(0xFF2F6BE0);
const Color kDotWeekend = Color(0xFF8B96AD);
const Color kDotDelay   = Color(0xFFFF8A47);
const Color kDotHoliday = Color(0xFF2BB7D9);

// =============================================================================
// LEGACY / ALIAS LAYER — keep every old token name resolving.
// =============================================================================
const Color kSurfaceDark   = kBgLight;
const Color kSurfaceCardDk = kSurfaceLight;
const Color kSurfaceLiftDk = kSurfaceLift;
const Color kBorderDk      = kBorderLight;
const Color kTextDk        = kInk900;
const Color kTextDkMuted   = kInk500;
const Color kTextDkHint    = kInk400;

const Color kLime500 = kAmber500;
const Color kLime600 = kAmber600;
const Color kLime300 = kAmber300;
const Color kLime50  = kAmber50;

const Color kMission500 = kAmber500;
const Color kMission600 = kAmber600;
const Color kMission300 = kAmber300;
const Color kMission50  = kAmber50;

const Color kPillPink   = kKpiPinkInk;
const Color kPillPurple = kKpiPurpleInk;
const Color kPillSky    = kKpiSkyInk;
const Color kPillTeal   = kGlowCyan;

const Color kBrand       = kNavy900;
const Color kBrandDark   = kNavy900;
const Color kAccent      = kNavy700;
const Color kSun         = kAmber500;
const Color kMint        = kSuccess600;
const Color kCoral       = kDanger600;
const Color kInk         = kInk900;
const Color kInkSoft     = kInk500;
const Color kBorderSoft  = kBorderLight;
const Color kSurface     = kBgLight;
const Color kSurfaceCard = kSurfaceLight;

const String kMissionTagline = 'Serving communities across Sri Lanka';

// Hero gradient — navy → indigo → bright blue. Used for the home hero band
// and section banners.
const LinearGradient kBrandGradient = LinearGradient(
  colors: [kNavy900, kNavy800, kNavy700],
  stops: [0.0, 0.55, 1.0],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

// Bright-blue banner gradient (the "Mark attendance" card).
const LinearGradient kBlueBanner = LinearGradient(
  colors: [Color(0xFF3B5BDB), Color(0xFF2F6BE0)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

// Aurora gradient (the "My Team" card) — deep indigo with magenta sweep.
const LinearGradient kAuroraBanner = LinearGradient(
  colors: [Color(0xFF2A2A6E), Color(0xFF5B3FA8), Color(0xFF9D4EDD)],
  stops: [0.0, 0.55, 1.0],
  begin: Alignment.centerLeft,
  end: Alignment.centerRight,
);

const List<Color> kBrandGradientStops   = [kNavy900, kNavy800];
const List<Color> kMissionGradientStops = [kAmber600, kAmber500];

// Soft coloured glow — use as a BoxShadow for a lifted accent.
List<BoxShadow> glow(Color color, {double blur = 22, double opacity = 0.28}) => [
  BoxShadow(
    color: color.withValues(alpha: opacity),
    blurRadius: blur,
    spreadRadius: -4,
    offset: const Offset(0, 8),
  ),
];

ThemeData buildGerslTheme() {
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: kSurfaceLight,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  final scheme = ColorScheme.fromSeed(
    seedColor: kNavy800,
    brightness: Brightness.light,
    primary: kNavy900,
    secondary: kAmber500,
    tertiary: kNavy700,
    surface: kSurfaceLight,
    error: kDanger600,
  );

  final textTheme = GoogleFonts.interTextTheme().apply(
    bodyColor: kInk900,
    displayColor: kInk900,
  );

  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: kBgLight,
    splashFactory: InkSparkle.splashFactory,
    textTheme: textTheme.copyWith(
      headlineLarge: textTheme.headlineLarge?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.6, color: kInk900,
      ),
      headlineSmall: textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.4, color: kInk900,
      ),
      titleLarge: textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.3, color: kInk900,
      ),
      titleMedium: textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w700, color: kInk900,
      ),
      bodyMedium: textTheme.bodyMedium?.copyWith(color: kInk500, height: 1.45),
      bodySmall:  textTheme.bodySmall?.copyWith(color: kInk500),
      labelLarge: textTheme.labelLarge?.copyWith(
        fontWeight: FontWeight.w700, letterSpacing: 0.1, color: kInk900,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: kBgLight,
      surfaceTintColor: Colors.transparent,
      foregroundColor: kInk900,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      iconTheme: const IconThemeData(color: kInk900),
      titleTextStyle: GoogleFonts.inter(
        fontSize: 18, fontWeight: FontWeight.w800,
        color: kInk900, letterSpacing: -0.3,
      ),
      systemOverlayStyle: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: kSurfaceLight,
      surfaceTintColor: Colors.transparent,
      shadowColor: kNavy900.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: kBorderLight),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        backgroundColor: kAmber500,
        foregroundColor: kNavy900,
        elevation: 0,
        shadowColor: kAmber500.withValues(alpha: 0.30),
        textStyle: GoogleFonts.inter(
            fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        foregroundColor: kInk900,
        side: const BorderSide(color: kBorderLight, width: 1.4),
        textStyle: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: kNavy700,
        textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kSurfaceLight,
      hintStyle: GoogleFonts.inter(color: kInk400, fontSize: 14),
      labelStyle: GoogleFonts.inter(color: kInk500, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kBorderLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kBorderLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kNavy700, width: 1.6),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: kNavy900,
      contentTextStyle: GoogleFonts.inter(
          color: Colors.white, fontWeight: FontWeight.w500),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: kInk100,
      labelStyle: GoogleFonts.inter(
          color: kInk900, fontWeight: FontWeight.w700, fontSize: 12),
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: kSurfaceLight,
      surfaceTintColor: Colors.transparent,
      indicatorColor: kNavy50,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return GoogleFonts.inter(
          fontSize: 11.5,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? kNavy700 : kInk500,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? kNavy700 : kInk500,
          size: 22,
        );
      }),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: kSurfaceLight,
      selectedItemColor: kNavy700,
      unselectedItemColor: kInk500,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: kSurfaceLight,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: kBorderLight),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: kSurfaceLight,
      surfaceTintColor: Colors.transparent,
    ),
    dividerTheme: const DividerThemeData(
      color: kBorderLight,
      thickness: 1,
      space: 1,
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: kNavy700,
    ),
  );
}

// Backwards-compat — old code still calls these names.
ThemeData get gerslLightTheme => buildGerslTheme();
ThemeData gerslDarkTheme = buildGerslTheme();
