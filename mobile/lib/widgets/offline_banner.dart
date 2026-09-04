import 'package:flutter/material.dart';
import '../services/connectivity.dart';

/// App-wide "you're offline" bar. Wrap the app's `child` in [OfflineOverlay]
/// once (via MaterialApp.builder) and it shows on every screen when the
/// device loses connectivity.
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
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: IgnorePointer(
                ignoring: !offline,
                child: AnimatedSlide(
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOut,
                  offset: offline ? Offset.zero : const Offset(0, -1),
                  child: Material(
                    color: const Color(0xFF334155),
                    child: SafeArea(
                      bottom: false,
                      child: Semantics(
                        liveRegion: true,
                        label: 'You are offline. Showing saved content.',
                        child: const Padding(
                          padding:
                              EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.wifi_off_rounded,
                                  size: 15, color: Colors.white),
                              SizedBox(width: 8),
                              Text(
                                "You're offline — showing saved content",
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
