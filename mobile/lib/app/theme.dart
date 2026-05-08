import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// =============================================================================
// GERSL mobile design — DARK theme with lime-green accent.
// Replaces the previous navy/mission-amber light theme.
//   Surface (canvas): kSurfaceDark (#10212F) — deep teal-navy
//   Card surface:    kSurfaceCard (#1B2C3E) — slightly lighter
//   Primary accent:  kLime500 (#A4F056)     — lime-green
//   Text:            #FFFFFF primary, #9DABBC secondary
// =============================================================================

// --- DARK SURFACE PALETTE -------------------------------------------------
const Color kSurfaceDark    = Color(0xFF10212F); // page bg
const Color kSurfaceCardDk  = Color(0xFF1B2C3E); // primary card
const Color kSurfaceLiftDk  = Color(0xFF243749); // hovered/elevated card
const Color kBorderDk       = Color(0xFF2C3F52);
const Color kTextDk         = Color(0xFFFFFFFF);
const Color kTextDkMuted    = Color(0xFF9DABBC);
const Color kTextDkHint     = Color(0xFF7A8A9E);

// --- LIME-GREEN ACCENT ----------------------------------------------------
const Color kLime500 = Color(0xFFA4F056); // primary accent
const Color kLime600 = Color(0xFF7BD63B); // hover / pressed
const Color kLime300 = Color(0xFFC8FA8E); // light tint
const Color kLime50  = Color(0xFF2C3F2C); // dark-on-dark tint for "soft" badges

// --- STATUS PILL TONES (work on both dark + light bg) ---------------------
const Color kPillPink   = Color(0xFFF08AA8);
const Color kPillPurple = Color(0xFF8A7AE6);
const Color kPillSky    = Color(0xFF6FB6FF);
const Color kPillTeal   = Color(0xFF4DD0C8);

// --- LEGACY NAVY / MISSION TOKENS ------------------------------------------
// Most of the old theme code still references these names; keep them as
// aliases so we don't have to touch every screen at once.
const Color kNavy900 = kSurfaceCardDk;        // was #0D1D3D
const Color kNavy800 = kSurfaceLiftDk;        // was #142A55
const Color kNavy700 = Color(0xFF2C4459);
const Color kNavy50  = Color(0xFF243749);

const Color kMission500 = kLime500;           // was amber #F59E0B
const Color kMission600 = kLime600;
const Color kMission300 = kLime300;
const Color kMission50  = kLime50;

const Color kInk900 = kTextDk;                // was #0F172A
const Color kInk700 = Color(0xFFB8C4D2);
const Color kInk500 = kTextDkMuted;
const Color kInk400 = kTextDkHint;
const Color kInk200 = kBorderDk;
const Color kInk100 = Color(0xFF253647);
const Color kInk50  = kSurfaceDark;

const Color kSuccess600 = kLime500;
const Color kDanger600  = Color(0xFFFF5471);
const Color kWarn600    = Color(0xFFF5B72E);

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
    brightness: Brightness.dark,
    primary: kLime500,
    secondary: kLime600,
    tertiary: kLime300,
    surface: kSurfaceCardDk,
    error: kDanger600,
  );

  final textTheme = GoogleFonts.interTextTheme().apply(
    bodyColor: kTextDk,
    displayColor: kTextDk,
  );

  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: kSurfaceDark,
    splashFactory: InkSparkle.splashFactory,
    textTheme: textTheme.copyWith(
      headlineLarge: textTheme.headlineLarge?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.6, color: kTextDk,
      ),
      headlineSmall: textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.4, color: kTextDk,
      ),
      titleLarge: textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.3, color: kTextDk,
      ),
      titleMedium: textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w700, color: kTextDk,
      ),
      bodyMedium: textTheme.bodyMedium?.copyWith(color: kTextDkMuted, height: 1.45),
      bodySmall:  textTheme.bodySmall?.copyWith(color: kTextDkMuted),
      labelLarge: textTheme.labelLarge?.copyWith(
        fontWeight: FontWeight.w700, letterSpacing: 0.1, color: kTextDk,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: kSurfaceDark,
      surfaceTintColor: Colors.transparent,
      foregroundColor: kTextDk,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      iconTheme: const IconThemeData(color: kTextDk),
      titleTextStyle: GoogleFonts.inter(
        fontSize: 18, fontWeight: FontWeight.w800,
        color: kTextDk, letterSpacing: -0.3,
      ),
      systemOverlayStyle: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: kSurfaceCardDk,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.black.withValues(alpha: 0.30),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: kBorderDk),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        backgroundColor: kLime500,
        foregroundColor: kSurfaceDark,
        elevation: 0,
        shadowColor: kLime500.withValues(alpha: 0.30),
        textStyle: GoogleFonts.inter(
            fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        foregroundColor: kTextDk,
        side: const BorderSide(color: kBorderDk, width: 1.4),
        textStyle: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: kLime500,
        textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kSurfaceCardDk,
      hintStyle: GoogleFonts.inter(color: kTextDkHint, fontSize: 14),
      labelStyle: GoogleFonts.inter(color: kTextDkMuted, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kBorderDk),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kBorderDk),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: kLime500, width: 1.6),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: kSurfaceLiftDk,
      contentTextStyle: GoogleFonts.inter(
          color: kTextDk, fontWeight: FontWeight.w500),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: kSurfaceLiftDk,
      labelStyle: GoogleFonts.inter(
          color: kTextDk, fontWeight: FontWeight.w700, fontSize: 12),
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: kSurfaceCardDk,
      surfaceTintColor: Colors.transparent,
      indicatorColor: kLime500.withValues(alpha: 0.18),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return GoogleFonts.inter(
          fontSize: 11.5,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? kLime500 : kTextDkMuted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? kLime500 : kTextDkMuted,
          size: 22,
        );
      }),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: kSurfaceCardDk,
      selectedItemColor: kLime500,
      unselectedItemColor: kTextDkMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
    ),
    dividerTheme: const DividerThemeData(
      color: kBorderDk,
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
