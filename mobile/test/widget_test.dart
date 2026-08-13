import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:holidaycity_mobile/main.dart';

void main() {
  testWidgets('App loads without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const HolidayCityApp());
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
  });

  testWidgets('Home screen can render with the custom bottom navigation',
      (WidgetTester tester) async {
    await tester.pumpWidget(const HolidayCityApp());
    await tester.pumpAndSettle();

    expect(find.byType(Scaffold), findsWidgets);
  });
}
