import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// =============================================================================
// GERSL mobile design — LIGHT theme (modern HR dashboard).
//   Page bg:     kBgLight   (#F2F4F8) — soft cool grey/lavender
//   Card:        kSurface   (#FFFFFF)
//   Primary:     kNavy900   (#0E1E3A) — deep navy for headers, body text
//   Accent CTA:  kAmber500  (#F8B834) — warm golden yellow
//   KPI pastels: pink / cream / mint for Summary tiles
//   Module icon: kSky100 circle with navy glyph
// All legacy/dark token names (kSurfaceDark, kLime500, kInk900…) are aliased
// onto this scheme so screens that imported them continue to compile.
// =============================================================================

// --- LIGHT SURFACE PALETTE -----------------------------------------------
const Color kBgLight        = Color(0xFFF2F4F8);
const Color kSurfaceLight   = Color(0xFFFFFFFF);
const Color kSurfaceLift    = Color(0xFFF8FAFC);
const Color kBorderLight    = Color(0xFFE6EAF1);
const Color kBorderSofter   = Color(0xFFEEF1F6);

// Ink scale for text on light surfaces
const Color kInk900 = Color(0xFF0E1E3A); // primary text / navy
const Color kInk800 = Color(0xFF1F2D4F);
const Color kInk700 = Color(0xFF334566);
const Color kInk500 = Color(0xFF6B7A99); // muted / secondary text
const Color kInk400 = Color(0xFF94A3B8); // hint / tertiary
const Color kInk200 = Color(0xFFE2E8F0);
const Color kInk100 = Color(0xFFF1F5F9);
const Color kInk50  = kBgLight;

// --- BRAND NAVY (header gradient, primary navy) --------------------------
const Color kNavy900 = Color(0xFF0E1E3A);
const Color kNavy800 = Color(0xFF152B55);
const Color kNavy700 = Color(0xFF1F3A6E);
const Color kNavy50  = Color(0xFFE8EDF7);

// --- AMBER ACCENT (yellow CTA) -------------------------------------------
const Color kAmber500 = Color(0xFFF8B834);
const Color kAmber600 = Color(0xFFE0A41A);
const Color kAmber300 = Color(0xFFFCD58F);
const Color kAmber50  = Color(0xFFFEF6E3);

// --- KPI PASTEL TONES ----------------------------------------------------
// Used by the "Summary" strip on the dashboard.
const Color kKpiPinkBg     = Color(0xFFFCDDD6);
const Color kKpiPinkInk    = Color(0xFFE74C3C);
const Color kKpiCreamBg    = Color(0xFFFFEFCC);
const Color kKpiCreamInk   = Color(0xFFD08A1A);
const Color kKpiMintBg     = Color(0xFFD7F2DA);
const Color kKpiMintInk    = Color(0xFF2E9F4A);
const Color kKpiSkyBg      = Color(0xFFDCEBFF);
const Color kKpiSkyInk     = Color(0xFF2A6BD8);
const Color kKpiPurpleBg   = Color(0xFFE5DEFB);
const Color kKpiPurpleInk  = Color(0xFF6B4CD1);

// --- STATUS COLOURS ------------------------------------------------------
const Color kSuccess600 = Color(0xFF2E9F4A);
const Color kDanger600  = Color(0xFFE74C3C);
const Color kWarn600    = Color(0xFFD08A1A);

// --- WEEKLY-DONUT SLICE COLOURS (Attendance screen) ----------------------
const Color kDotPresent = Color(0xFF2E9F4A);
const Color kDotExDelay = Color(0xFFF8B834);
const Color kDotAbsent  = Color(0xFFE74C3C);
const Color kDotLeave   = Color(0xFF6B4CD1);
const Color kDotVisit   = Color(0xFF2A6BD8);
const Color kDotWeekend = Color(0xFF7B8BA8);
const Color kDotDelay   = Color(0xFFFF8A47);
const Color kDotHoliday = Color(0xFF3CC1B5);

// =============================================================================
// LEGACY / DARK-ALIAS LAYER
// Keep the dark-named tokens compiling but redirect them onto the light scheme
// so existing screens auto-inherit the new look without code edits.
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

const Color kPillPink   = Color(0xFFE74C3C);
const Color kPillPurple = Color(0xFF6B4CD1);
const Color kPillSky    = Color(0xFF2A6BD8);
const Color kPillTeal   = Color(0xFF3CC1B5);

// Other legacy aliases used across older screens.
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

// Header gradient — navy-blue with a hint of brighter blue at the bottom-right.
const LinearGradient kBrandGradient = LinearGradient(
  colors: [kNavy900, kNavy800, kNavy700],
  stops: [0.0, 0.55, 1.0],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

const List<Color> kBrandGradientStops   = [kNavy900, kNavy800];
const List<Color> kMissionGradientStops = [kAmber600, kAmber500];

ThemeData buildGerslTheme() {
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: kSurfaceLight,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  final scheme = ColorScheme.fromSeed(
    seedColor: kNavy900,
    brightness: Brightness.light,
    primary: kNavy900,
    secondary: kAmber500,
    tertiary: kAmber300,
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
      shadowColor: kNavy900.withValues(alpha: 0.06),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        foregroundColor: kInk900,
        side: const BorderSide(color: kBorderLight, width: 1.4),
        textStyle: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: kNavy900,
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
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kBorderLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kBorderLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kNavy900, width: 1.6),
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
      indicatorColor: kAmber500.withValues(alpha: 0.22),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return GoogleFonts.inter(
          fontSize: 11.5,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? kNavy900 : kInk500,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? kNavy900 : kInk500,
          size: 22,
        );
      }),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: kSurfaceLight,
      selectedItemColor: kNavy900,
      unselectedItemColor: kInk500,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
    ),
    dividerTheme: const DividerThemeData(
      color: kBorderLight,
      thickness: 1,
      space: 1,
    ),
  );
}

// Backwards-compat — old code still calls these names.
ThemeData get gerslLightTheme => buildGerslTheme();
ThemeData gerslDarkTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: kNavy900, brightness: Brightness.light, primary: kNavy900,
    secondary: kAmber500,
  ),
  appBarTheme: const AppBarTheme(centerTitle: false, scrolledUnderElevation: 0),
);
