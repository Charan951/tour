import 'package:flutter_test/flutter_test.dart';
import 'package:holidaycity_mobile/main.dart';

void main() {
  testWidgets('HolidayCity App Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(const HolidayCityApp());
    expect(find.text('HolidayCity'), findsOneWidget);
  });
}
