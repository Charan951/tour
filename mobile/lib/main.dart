import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/destination_provider.dart';
import 'providers/package_provider.dart';
import 'providers/banner_provider.dart';
import 'providers/specialization_theme_provider.dart';
import 'providers/theme_provider.dart';
import 'views/splash/splash_screen.dart';
import 'services/connectivity.dart';
import 'services/offline_queue.dart';
import 'widgets/offline_banner.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  ConnectivityStatus.instance.start();
  // Send anything left in the outbox from a previous offline session.
  OfflineQueue.instance.flush();
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
              // Clamp system text scaling so very large fonts stay usable,
              // and show the app-wide offline bar on every screen.
              final mq = MediaQuery.of(context);
              return MediaQuery(
                data: mq.copyWith(
                  textScaler: mq.textScaler.clamp(
                    minScaleFactor: 0.9,
                    maxScaleFactor: 1.3,
                  ),
                ),
                child: OfflineOverlay(child: child ?? const SizedBox()),
              );
            },
          );
        },
      ),
    );
  }
}
