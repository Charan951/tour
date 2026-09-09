import 'package:flutter/material.dart';
import '../services/connectivity.dart';
import '../views/network_error/network_error_screen.dart';

/// App-wide offline handler. Wraps the app child in [OfflineOverlay].
///
/// Behaviour:
///   - While internet is available → renders child normally, invisible.
///   - When confirmed offline (after debounce) → shows full-page [NetworkErrorScreen]
///     overlaid on top of the existing UI, so state is preserved.
///   - Animated fade-in / fade-out to avoid jarring transitions.
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
            // App content always rendered (preserves scroll / form state)
            Positioned.fill(child: child),

            // Offline overlay — fades in only when truly confirmed offline
            AnimatedOpacity(
              opacity: offline ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              child: offline
                  ? const Positioned.fill(
                      child: NetworkErrorScreen(),
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        );
      },
    );
  }
}
