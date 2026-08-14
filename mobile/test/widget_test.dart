import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:holidaycity_mobile/main.dart';
import 'package:holidaycity_mobile/providers/package_provider.dart';
import 'package:holidaycity_mobile/providers/specialization_theme_provider.dart';
import 'package:holidaycity_mobile/models/user_model.dart';
import 'package:holidaycity_mobile/services/enquiry_service.dart';
import 'package:holidaycity_mobile/views/packages/package_list_screen.dart';
import 'package:holidaycity_mobile/views/themes/theme_detail_screen.dart';
import 'package:holidaycity_mobile/views/themes/theme_screen.dart';
import 'package:provider/provider.dart';

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

  testWidgets('Tapping a theme opens its detail screen',
      (WidgetTester tester) async {
    final provider = SpecializationThemeProvider();
    await provider.fetchThemes();

    await tester.pumpWidget(
      ChangeNotifierProvider<SpecializationThemeProvider>.value(
        value: provider,
        child: const MaterialApp(home: ThemeScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Honeymoon Tour'), findsOneWidget);

    await tester.tap(find.text('Honeymoon Tour'));
    await tester.pumpAndSettle();

    expect(find.byType(ThemeDetailScreen), findsOneWidget);
  });

  testWidgets(
      'Package filter button opens real filter sheet and updates category',
      (WidgetTester tester) async {
    final provider = PackageProvider();

    await tester.pumpWidget(
      ChangeNotifierProvider<PackageProvider>.value(
        value: provider,
        child: const MaterialApp(home: PackageListScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.filter_list_rounded));
    await tester.pumpAndSettle();

    expect(find.text('Filters'), findsOneWidget);
    expect(find.text('Categories'), findsOneWidget);

    await tester.tap(find.text('Family').last);
    await tester.pumpAndSettle();

    expect(provider.selectedCategory, 'Family');
  });

  test(
      'Admin-like staff roles resolve as admin while regular users stay personal',
      () {
    final adminUser = UserModel(
      id: 'admin-1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      mobile: '9999999999',
      role: 'Admin',
    );

    final salesUser = UserModel(
      id: 'sales-1',
      firstName: 'Sales',
      lastName: 'Executive',
      email: 'sales@example.com',
      mobile: '7777777777',
      role: 'Sales Executive',
    );

    final customerUser = UserModel(
      id: 'user-1',
      firstName: 'Customer',
      lastName: 'User',
      email: 'customer@example.com',
      mobile: '8888888888',
      role: 'Customer',
    );

    expect(EnquiryService.isAdminRole(adminUser.role), isTrue);
    expect(EnquiryService.isAdminRole(salesUser.role), isTrue);
    expect(EnquiryService.isAdminRole(customerUser.role), isFalse);
  });
}
