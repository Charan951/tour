import 'package:flutter/widgets.dart';

/// App-wide navigator key so non-widget code (push-notification handlers) can
/// navigate without a BuildContext.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
