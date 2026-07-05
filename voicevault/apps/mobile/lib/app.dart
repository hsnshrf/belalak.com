import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'api/api_client.dart';
import 'data/database.dart';
import 'i18n/strings.dart';
import 'recording/recorder_service.dart';
import 'sync/sync_engine.dart';
import 'ui/home_screen.dart';
import 'ui/record_screen.dart';
import 'ui/search_screen.dart';
import 'ui/settings_screen.dart';

class VoiceVaultApp extends StatefulWidget {
  const VoiceVaultApp({
    super.key,
    required this.db,
    required this.api,
    required this.recorder,
    required this.sync,
  });

  final AppDatabase db;
  final ApiClient api;
  final RecorderService recorder;
  final SyncEngine sync;

  @override
  State<VoiceVaultApp> createState() => _VoiceVaultAppState();
}

class _VoiceVaultAppState extends State<VoiceVaultApp> {
  Locale _locale = const Locale('en');
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VoiceVault',
      locale: _locale,
      supportedLocales: supportedLocales,
      // Material/Cupertino delegates give us RTL layout for Arabic for free.
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE4574D), brightness: Brightness.dark),
        useMaterial3: true,
      ),
      home: Builder(builder: (context) {
        final screens = [
          HomeScreen(db: widget.db, api: widget.api, sync: widget.sync),
          RecordScreen(recorder: widget.recorder),
          SearchScreen(db: widget.db, api: widget.api),
          SettingsScreen(
            api: widget.api,
            locale: _locale,
            onLocaleChanged: (l) => setState(() => _locale = l),
          ),
        ];
        return Scaffold(
          body: SafeArea(child: screens[_tab]),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _tab,
            onDestinationSelected: (i) => setState(() => _tab = i),
            destinations: [
              NavigationDestination(icon: const Icon(Icons.library_music), label: tr(context, 'nav.library')),
              NavigationDestination(icon: const Icon(Icons.mic), label: tr(context, 'nav.record')),
              NavigationDestination(icon: const Icon(Icons.search), label: tr(context, 'nav.search')),
              NavigationDestination(icon: const Icon(Icons.settings), label: tr(context, 'nav.settings')),
            ],
          ),
        );
      }),
    );
  }
}
