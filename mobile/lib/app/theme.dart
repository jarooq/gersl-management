import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// =============================================================================
// GERSL mobile design tokens — mirrors the admin web design system.
//   Primary  : navy-900 (#0D1D3D)  — trust, NGO authority
//   Accent   : mission-amber (#F59E0B) — impact, calls-to-action
//   Surface  : ink-50 (#F5F7FA) canvas, white cards
//   Text     : ink-900 (#0F172A) primary, ink-500 (#64748B) secondary
// =============================================================================

const Color kNavy900 = Color(0xFF0D1D3D); // primary
const Color kNavy800 = Color(0xFF142A55);
const Color kNavy700 = Color(0xFF1F3D7A);
const Color kNavy50  = Color(0xFFE7ECF6);

const Color kMission500 = Color(0xFFF59E0B); // amber accent
const Color kMission600 = Color(0xFFD97706);
const Color kMission300 = Color(0xFFFCD34D);
const Color kMission50  = Color(0xFFFFFBEB);

const Color kInk900 = Color(0xFF0F172A);
const Color kInk700 = Color(0xFF334155);
const Color kInk500 = Color(0xFF64748B);
const Color kInk400 = Color(0xFF94A3B8);
const Color kInk200 = Color(0xFFE2E8F0);
const Color kInk100 = Color(0xFFEEF1F5);
const Color kInk50  = Color(0xFFF5F7FA);

const Color kSuccess600 = Color(0xFF16A34A);
const Color kDanger600  = Color(0xFFDC2626);
const Color kWarn600    = Color(0xFFCA8A04);

// Legacy aliases — keep so any future GERHR-style call sites continue to work.
const Color kBrand     = kNavy900;
const Color kBrandDark = kNavy900;
const Color kAccent    = kNavy700;
const Color kSun       = kMission500;
const Color kMint      = kSuccess600;
const Color kCoral     = kDanger600;
const Color kInk       = kInk900;
const Color kInkSoft   = kInk500;
const Color kBorderSoft= kInk200;
const Color kSurface   = kInk50;
const Color kSurfaceCard = Colors.white;

const String kMissionTagline = 'Serving communities across Sri Lanka';

const LinearGradient kBrandGradient = LinearGradient(
  colors: [kNavy900, kNavy800, kNavy700],
  stops: [0.0, 0.55, 1.0],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

const List<Color> kBrandGradientStops   = [kNavy900, kNavy800];
const List<Color> kMissionGradientStops = [kMission600, kMission500];

ThemeData buildGerslTheme() {
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.white,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  final scheme = ColorScheme.fromSeed(
    seedColor: kNavy900,
    brightness: Brightness.light,
    primary: kNavy900,
    secondary: kMission500,
    tertiary: kNavy700,
    surface: kInk50,
    error: kDanger600,
  );

  final textTheme = GoogleFonts.interTextTheme().apply(
    bodyColor: kInk900,
    displayColor: kInk900,
  );

  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    scaffoldBackgroundColor: kInk50,
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
        fontWeight: FontWeight.w700, letterSpacing: 0.1,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      foregroundColor: kInk900,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      iconTheme: const IconThemeData(color: kInk700),
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
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
      shadowColor: kInk900.withValues(alpha: 0.05),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: kInk200),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        backgroundColor: kNavy900,
        foregroundColor: Colors.white,
        elevation: 0,
        shadowColor: kNavy900.withValues(alpha: 0.25),
        textStyle: GoogleFonts.inter(
            fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        foregroundColor: kNavy900,
        side: const BorderSide(color: kInk200, width: 1.4),
        textStyle: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
      fillColor: Colors.white,
      hintStyle: GoogleFonts.inter(color: kInk400, fontSize: 14),
      labelStyle: GoogleFonts.inter(color: kInk500, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: kInk200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: kInk200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: kNavy700, width: 1.6),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: kInk900,
      contentTextStyle: GoogleFonts.inter(
          color: Colors.white, fontWeight: FontWeight.w500),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: kNavy900.withValues(alpha: 0.08),
      labelStyle: GoogleFonts.inter(
          color: kNavy900, fontWeight: FontWeight.w700, fontSize: 12),
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      indicatorColor: kMission500.withValues(alpha: 0.18),
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
      backgroundColor: Colors.white,
      selectedItemColor: kNavy900,
      unselectedItemColor: kInk500,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
    ),
    dividerTheme: const DividerThemeData(
      color: kInk100,
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
    seedColor: kNavy900, brightness: Brightness.dark, primary: kNavy700,
    secondary: kMission500,
  ),
  appBarTheme: const AppBarTheme(centerTitle: false, scrolledUnderElevation: 0),
);
