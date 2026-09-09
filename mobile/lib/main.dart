import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
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
  try {
    if (Firebase.apps.isEmpty) {
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
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
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
