import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';

/// Static Privacy Policy / Terms & Conditions pages, mirroring the web
/// content. `LegalScreen.privacy()` / `LegalScreen.terms()`.
class LegalScreen extends StatelessWidget {
  final String title;
  final String updated;
  final List<LegalSection> sections;

  const LegalScreen._(
      {required this.title, required this.updated, required this.sections});

  factory LegalScreen.privacy() => const LegalScreen._(
        title: 'Privacy Policy',
        updated: 'Last updated: August 2026',
        sections: [
          LegalSection('Who we are', [
            'HolidayCity Pvt. Ltd. is a travel-planning service. This policy explains what personal information we collect when you use the HolidayCity app, why we collect it, and the choices you have.',
          ]),
          LegalSection('Information we collect', [
            'Details you give us — name, email, phone number, city, and the trip details in an enquiry or booking.',
            'Account data — your login credentials and profile preferences (language, currency).',
            'Usage data — screens viewed, packages opened, and app diagnostics, used only to keep the app working and improve it.',
          ]),
          LegalSection('How we use it', [
            'To respond to your enquiries and manage your bookings and payments.',
            'To let a travel consultant contact you by phone, WhatsApp or email about your trip.',
            'To operate, secure and improve the app. We do not sell your personal data.',
          ]),
          LegalSection('Sharing', [
            'We share information only with the consultants and operators handling your trip, our payment and messaging providers, and where the law requires it.',
          ]),
          LegalSection('Data retention & security', [
            'We keep enquiry and booking records for as long as needed to serve you and meet legal obligations, then delete or anonymise them. Data is transmitted over encrypted connections.',
          ]),
          LegalSection('Your choices', [
            'You can view and edit your profile in the app, ask us to correct or delete your data, and opt out of marketing messages at any time.',
          ]),
          LegalSection('Contact', [
            'Questions about this policy? Reach us through the in-app support chat or the contact details on holidaycity.com.',
          ]),
        ],
      );

  factory LegalScreen.terms() => const LegalScreen._(
        title: 'Terms & Conditions',
        updated: 'Last updated: August 2026',
        sections: [
          LegalSection('Using the app', [
            'By creating an account or continuing as a guest you agree to these terms. If you do not agree, please do not use the app.',
          ]),
          LegalSection('Enquiries and quotes', [
            'Submitting an enquiry is free and places you under no obligation. Prices shown in the app are indicative; a travel consultant confirms the final itinerary and price in your quote.',
          ]),
          LegalSection('Bookings and payments', [
            'A booking is confirmed only after a consultant accepts it and any advance payment is received. Balance payments, changes and cancellations follow the terms stated in your confirmed quote.',
          ]),
          LegalSection('Your responsibilities', [
            'Provide accurate traveller information, hold valid travel documents and visas, and follow the operator’s instructions during the trip.',
          ]),
          LegalSection('Content', [
            'Package, destination and imagery in the app are for general guidance and may change. We try to keep information accurate but do not warrant that it is always complete or current.',
          ]),
          LegalSection('Liability', [
            'HolidayCity arranges travel services provided by third-party operators. Our liability is limited to the extent permitted by applicable law; we are not liable for events outside our reasonable control.',
          ]),
          LegalSection('Changes', [
            'We may update these terms; continued use of the app after an update means you accept the revised terms.',
          ]),
        ],
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(title),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.textPrimary,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        children: [
          Text(updated,
              style: const TextStyle(
                  fontSize: 12, color: AppTheme.textSecondary)),
          const SizedBox(height: 20),
          for (final s in sections) ...[
            Text(s.heading,
                style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 8),
            for (final p in s.paragraphs)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  p,
                  style: const TextStyle(
                      fontSize: 13.5,
                      height: 1.5,
                      color: AppTheme.textSecondary),
                ),
              ),
            const SizedBox(height: 14),
          ],
        ],
      ),
    );
  }
}

class LegalSection {
  final String heading;
  final List<String> paragraphs;
  const LegalSection(this.heading, this.paragraphs);
}
