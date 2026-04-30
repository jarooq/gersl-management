import 'package:flutter/material.dart';

const _seed = Color(0xFF1D4ED8);

ThemeData gerslLightTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(seedColor: _seed, brightness: Brightness.light),
  appBarTheme: const AppBarTheme(centerTitle: false, scrolledUnderElevation: 0),
);

ThemeData gerslDarkTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(seedColor: _seed, brightness: Brightness.dark),
  appBarTheme: const AppBarTheme(centerTitle: false, scrolledUnderElevation: 0),
);
