import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// =============================================================================
// GERSL mobile design — FUTURISTIC DARK theme (2026 redesign).
//
//   Page bg:     kBgLight   (#070A14) — deep-space navy-black
//   Card:        kSurface   (#121A2E) — elevated dark glass surface
//   Primary txt: kInk900    (#EEF2FB) — near-white
//   Accent CTA:  kAmber500  (#F8B834) — warm amber, glows on dark
//   Glow accent: kGlowCyan  (#3DE0F5) — electric cyan for highlights
//
// The token NAMES are unchanged from the old light theme so every screen
// keeps compiling — only the VALUES flipped to the dark scheme. Screens that
// use tokens transform automatically; screens with hardcoded Colors.white /
// Colors.grey are swept separately.
//
// All legacy/dark-alias token names (kSurfaceDark, kLime500, kInk900…) remain
// aliased so older imports still resolve.
// =============================================================================

// --- DARK SURFACE PALETTE ------------------------------------------------
const Color kBgLight        = Color(0xFF070A14); // page background — deepest
const Color kSurfaceLight   = Color(0xFF121A2E); // cards / panels
const Color kSurfaceLift    = Color(0xFF1A2440); // raised / hover surface
const Color kBorderLight    = Color(0xFF263150); // hairline borders
const Color kBorderSofter   = Color(0xFF1C2540);

// Ink scale — now LIGHT text on dark surfaces.
const Color kInk900 = Color(0xFFEEF2FB); // primary text — near white
const Color kInk800 = Color(0xFFD6DEEF);
const Color kInk700 = Color(0xFFB4C0DA);
const Color kInk500 = Color(0xFF7E8BA8); // muted / secondary text
const Color kInk400 = Color(0xFF566085); // hint / tertiary text
const Color kInk200 = Color(0xFF2A3454); // chip bg / divider on dark
const Color kInk100 = Color(0xFF1A2238); // darker chip bg
const Color kInk50  = kBgLight;

// --- BRAND NAVY (deep header gradient) -----------------------------------
const Color kNavy900 = Color(0xFF0A0E1C); // deepest navy — header base
const Color kNavy800 = Color(0xFF111A33);
const Color kNavy700 = Color(0xFF1B2748);
const Color kNavy50  = Color(0xFF1A2440); // legacy "tint" → dark raised

// --- AMBER ACCENT (yellow CTA — glows on dark) ---------------------------
const Color kAmber500 = Color(0xFFF8B834);
const Color kAmber600 = Color(0xFFE0A41A);
const Color kAmber300 = Color(0xFFFCD58F);
const Color kAmber50  = Color(0xFF2A2410); // legacy light tint → dark amber wash

// --- ELECTRIC GLOW ACCENT (futuristic highlight) -------------------------
const Color kGlowCyan   = Color(0xFF3DE0F5);
const Color kGlowViolet = Color(0xFF8B7CFF);

// --- KPI TONES (deep tint bg + bright glowing ink for dark cards) --------
const Color kKpiPinkBg     = Color(0xFF2C1820);
const Color kKpiPinkInk    = Color(0xFFFF7A8A);
const Color kKpiCreamBg    = Color(0xFF2C2410);
const Color kKpiCreamInk   = Color(0xFFFFC857);
const Color kKpiMintBg     = Color(0xFF11281E);
const Color kKpiMintInk    = Color(0xFF4FE3A0);
const Color kKpiSkyBg      = Color(0xFF112236);
const Color kKpiSkyInk     = Color(0xFF56B6FF);
const Color kKpiPurpleBg   = Color(0xFF1F1B38);
const Color kKpiPurpleInk  = Color(0xFFA593FF);

// --- STATUS COLOURS (bright on dark) -------------------------------------
const Color kSuccess600 = Color(0xFF34D399);
const Color kDanger600  = Color(0xFFFB6B6B);
const Color kWarn600    = Color(0xFFFBBF4D);

// --- WEEKLY-DONUT SLICE COLOURS (Attendance screen) ----------------------
const Color kDotPresent = Color(0xFF34D399);
const Color kDotExDelay = Color(0xFFF8B834);
const Color kDotAbsent  = Color(0xFFFB6B6B);
const Color kDotLeave   = Color(0xFFA593FF);
const Color kDotVisit   = Color(0xFF56B6FF);
const Color kDotWeekend = Color(0xFF5A6685);
const Color kDotDelay   = Color(0xFFFF9B5A);
const Color kDotHoliday = Color(0xFF3DE0F5);

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
const Color kAccent      = kGlowCyan;
const Color kSun         = kAmber500;
const Color kMint        = kSuccess600;
const Color kCoral       = kDanger600;
const Color kInk         = kInk900;
const Color kInkSoft     = kInk500;
const Color kBorderSoft  = kBorderLight;
const Color kSurface     = kBgLight;
const Color kSurfaceCard = kSurfaceLight;

const String kMissionTagline = 'Serving communities across Sri Lanka';

// Header gradient — deep-space navy with a faint lift toward the corner.
const LinearGradient kBrandGradient = LinearGradient(
  colors: [kNavy900, kNavy800, kNavy700],
  stops: [0.0, 0.6, 1.0],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

const List<Color> kBrandGradientStops   = [kNavy900, kNavy800];
const List<Color> kMissionGradientStops = [kAmber600, kAmber500];

// Soft coloured glow — use as a BoxShadow for the "futuristic" lift.
List<BoxShadow> glow(Color color, {double blur = 24, double opacity = 0.34}) => [
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
    statusBarIconBrightness: Brightness.light,   // light icons on dark bg
    systemNavigationBarColor: kBgLight,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  final scheme = ColorScheme.fromSeed(
    seedColor: kNavy900,
    brightness: Brightness.dark,
    primary: kAmber500,
    onPrimary: kNavy900,
    secondary: kGlowCyan,
    tertiary: kAmber300,
    surface: kSurfaceLight,
    onSurface: kInk900,
    error: kDanger600,
  );

  final textTheme = GoogleFonts.interTextTheme().apply(
    bodyColor: kInk900,
    displayColor: kInk900,
  );

  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    brightness: Brightness.dark,
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
      systemOverlayStyle: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: kSurfaceLight,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.black.withValues(alpha: 0.4),
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
        shadowColor: kAmber500.withValues(alpha: 0.40),
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
        foregroundColor: kAmber500,
        textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kSurfaceLift,
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
        borderSide: const BorderSide(color: kAmber500, width: 1.6),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: kSurfaceLift,
      contentTextStyle: GoogleFonts.inter(
          color: kInk900, fontWeight: FontWeight.w500),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: kBorderLight),
      ),
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
      indicatorColor: kAmber500.withValues(alpha: 0.22),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return GoogleFonts.inter(
          fontSize: 11.5,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? kInk900 : kInk500,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? kAmber500 : kInk500,
          size: 22,
        );
      }),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: kSurfaceLight,
      selectedItemColor: kAmber500,
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
      color: kAmber500,
    ),
    iconTheme: const IconThemeData(color: kInk700),
  );
}

// Backwards-compat — old code still calls these names.
ThemeData get gerslLightTheme => buildGerslTheme();
ThemeData gerslDarkTheme = buildGerslTheme();
