import 'package:flutter/material.dart';
import '../services/connectivity.dart';
import '../views/network_error/network_error_screen.dart';

/// App-wide offline handler. Wraps MaterialApp child in [OfflineOverlay]
/// and presents full-page NetworkErrorScreen when internet connectivity is lost.
class OfflineOverlay extends StatelessWidget {
  final Widget child;
  const OfflineOverlay({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: ConnectivityStatus.instance,
      builder: (context, _) {
        final offline = !ConnectivityStatus.instance.online;
        return Stack(
          children: [
            Positioned.fill(child: child),
            if (offline)
              const Positioned.fill(
                child: NetworkErrorScreen(),
              ),
          ],
        );
      },
    );
  }
}
