import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/api_config.dart';
import 'config/theme.dart';
import 'config/app_globals.dart';
import 'providers/auth_provider.dart';
import 'providers/destination_provider.dart';
import 'providers/package_provider.dart';
import 'providers/banner_provider.dart';
import 'providers/specialization_theme_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/notification_provider.dart';
import 'services/connectivity.dart';
import 'widgets/offline_banner.dart';
import 'views/splash/splash_screen.dart';


import 'package:firebase_core/firebase_core.dart';
import 'services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.loadSavedEnvironment();

  // One-time migration: force production mode on physical devices.
  // The old default was 'localhost' which doesn't work on real phones.
  // This clears the stale preference and sets production as default.
  try {
    final prefs = await SharedPreferences.getInstance();
    const migrationKey = 'hc_migration_v2_production_default';
    if (!prefs.containsKey(migrationKey)) {
      await prefs.setBool(migrationKey, true);
      // Only override if they had the old localhost default (false)
      if (!ApiConfig.isProduction) {
        await ApiConfig.setProduction(true);
        if (kDebugMode) print('🔄 Migrated API env to Production (was localhost)');
      }
    }
  } catch (_) {}

  try {
    if (Firebase.apps.isEmpty && !kIsWeb) {
      await Firebase.initializeApp();
    }
  } catch (e) {
    if (kDebugMode) {
      print('Firebase initializeApp error: $e');
    }
  }
  ConnectivityStatus.instance.start();
  await PushNotificationService.instance.initialize();
  runApp(const HolidayCityApp());
}

class HolidayCityApp extends StatelessWidget {
  const HolidayCityApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PackageProvider()),
        ChangeNotifierProvider(create: (_) => DestinationProvider()),
        ChangeNotifierProvider(create: (_) => BannerProvider()),
        ChangeNotifierProvider(create: (_) => SpecializationThemeProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'HolidayCity Travel',
            navigatorKey: navigatorKey,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            home: const SplashScreen(),
            builder: (context, child) {
              // Clamp system text scaling so very large fonts stay usable.
              final mq = MediaQuery.of(context);
              return OfflineOverlay(
                child: MediaQuery(
                  data: mq.copyWith(
                    textScaler: mq.textScaler.clamp(
                      minScaleFactor: 0.9,
                      maxScaleFactor: 1.3,
                    ),
                  ),
                  child: child ?? const SizedBox(),
                ),
              );
            },
   
          );
        },
      ),
    );
  }
}
