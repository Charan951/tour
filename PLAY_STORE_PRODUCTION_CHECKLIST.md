# Flutter Android — Google Play Store Production Checklist

## Purpose

This document is the mandatory production-readiness checklist for this Flutter application before publishing to Google Play Store.

The goal is to perform a **complete production audit** of the existing project and identify or fix all issues required for a safe, secure, stable, and compliant Play Store release.

---

# 🚨 CRITICAL INSTRUCTIONS FOR CLAUDE

## DO NOT START CODING IMMEDIATELY

Before making any changes:

1. Read this entire checklist.
2. Read `MEMORY.md` if it exists.
3. Inspect the complete project structure.
4. Understand the existing Flutter architecture.
5. Inspect Android configuration.
6. Inspect backend/API configuration if present.
7. Inspect Firebase configuration if present.
8. Inspect authentication.
9. Inspect payments if present.
10. Inspect notifications if present.
11. Inspect environment configuration.
12. Inspect CI/CD if present.
13. Inspect existing signing configuration.
14. Inspect current versioning.
15. Inspect dependencies.
16. Inspect permissions.
17. Inspect privacy/security-related implementation.
18. Inspect release/build configuration.

### IMPORTANT

Do NOT blindly change versions, Gradle, Kotlin, Java, SDK, dependencies, package names, signing configuration, or production URLs.

First determine what already exists.

For every proposed change, explain:

* What currently exists
* What is wrong/missing
* Why it matters
* What needs to change
* Risk of the change
* Whether the change can be automated safely

Only then implement safe changes.

---

# 1. PROJECT DISCOVERY

Audit the entire repository.

Check:

* [ ] Flutter project structure
* [ ] `pubspec.yaml`
* [ ] `pubspec.lock`
* [ ] `lib/`
* [ ] `android/`
* [ ] `test/`
* [ ] `assets/`
* [ ] environment/config files
* [ ] Firebase configuration
* [ ] backend configuration
* [ ] CI/CD configuration
* [ ] Git configuration
* [ ] documentation
* [ ] scripts
* [ ] build configuration

Determine:

* Flutter version
* Dart version
* Android Gradle Plugin version
* Gradle version
* Kotlin version
* Java/JDK version
* compile SDK
* target SDK
* min SDK
* application ID
* namespace
* current app version
* current build number

---

# 2. FLUTTER CODE QUALITY

Run and inspect:

```bash
flutter doctor -v
flutter analyze
flutter test
```

Check:

* [ ] No critical Flutter doctor issues
* [ ] No analyzer errors
* [ ] No analyzer warnings that can affect production
* [ ] Tests pass
* [ ] No broken imports
* [ ] No dead code
* [ ] No unused dependencies
* [ ] No unnecessary dependencies
* [ ] No development-only code in production
* [ ] No mock data
* [ ] No fake API responses
* [ ] No hardcoded test users
* [ ] No debug-only behavior
* [ ] No unnecessary `print()` statements
* [ ] No sensitive logging
* [ ] No TODOs that affect production functionality

Search the project for:

```text
print(
debugPrint(
TODO
FIXME
localhost
127.0.0.1
192.168.
staging
development
mock
dummy
test@example
password
secret
apiKey
privateKey
```

Do NOT automatically remove legitimate references.

Review each result.

---

# 3. APPLICATION IDENTITY

Verify:

* [ ] Final application ID
* [ ] Final Android namespace
* [ ] Correct package name
* [ ] Correct application name
* [ ] Correct launcher icon
* [ ] Correct adaptive icon
* [ ] Correct splash screen
* [ ] Correct branding
* [ ] No development branding

Confirm that the application ID is intentional and production-ready.

DO NOT change the application ID without explicit approval.

---

# 4. VERSIONING

Inspect:

```yaml
version: x.y.z+build
```

Verify:

* [ ] Version name is production-ready
* [ ] Version code/build number is correct
* [ ] Build number is unique
* [ ] Future releases can increment it safely
* [ ] No conflicting Android version configuration

Report the current version before making changes.

---

# 5. ANDROID SDK / BUILD CONFIGURATION

Inspect:

```text
android/app/
android/build.gradle
android/build.gradle.kts
android/settings.gradle
android/settings.gradle.kts
android/gradle/
gradle.properties
gradle-wrapper.properties
```

Verify compatibility between:

* Flutter
* Dart
* Android Gradle Plugin
* Gradle
* Kotlin
* Java
* compile SDK
* target SDK
* min SDK
* Android plugins

## Current Google Play requirement

For releases in 2026, verify the current Google Play target API requirement and ensure the application satisfies the applicable requirement.

At the time of this checklist:

```text
targetSdk >= 36
```

Do not change SDK/Gradle/Kotlin/Java versions blindly.

If an upgrade is required:

1. Identify current version.
2. Identify required version.
3. Check Flutter compatibility.
4. Check plugin compatibility.
5. Check breaking changes.
6. Upgrade incrementally.
7. Run tests.
8. Build release AAB.
9. Test the resulting application.

---

# 6. RELEASE SIGNING

Verify production signing.

Check for:

```text
key.properties
*.jks
*.keystore
```

Determine:

* [ ] Upload keystore exists
* [ ] Upload alias exists
* [ ] Signing configuration exists
* [ ] Release build uses release signing
* [ ] Debug signing is NOT used for production
* [ ] Keystore is not committed to Git
* [ ] `key.properties` is not committed
* [ ] Signing secrets are protected
* [ ] Signing credentials are backed up securely

Check `.gitignore`.

Expected sensitive entries should include appropriate signing files, for example:

```gitignore
android/key.properties
*.jks
*.keystore
```

Do not expose or print secret values.

---

# 7. GOOGLE PLAY APP SIGNING

Verify:

* [ ] Google Play App Signing is planned/enabled
* [ ] Upload key is understood
* [ ] App signing key is understood
* [ ] Upload credentials are securely backed up
* [ ] Release process is documented

DO NOT generate or replace production signing keys without explicit approval.

---

# 8. ENVIRONMENT CONFIGURATION

Determine whether the application has:

```text
development
staging
production
```

environments.

Verify production release uses only production services.

Search for:

```text
localhost
127.0.0.1
192.168.x.x
staging URLs
development URLs
test URLs
mock APIs
```

Check:

* [ ] Production API URL
* [ ] Production database
* [ ] Production authentication
* [ ] Production Firebase
* [ ] Production storage
* [ ] Production payment gateway
* [ ] Production maps
* [ ] Production notifications
* [ ] Production analytics
* [ ] Production backend

DO NOT expose backend secrets in the Flutter application.

---

# 9. SECURITY AUDIT

Perform a complete security audit.

Search for:

* [ ] API secrets
* [ ] API keys that must remain private
* [ ] payment secret keys
* [ ] database credentials
* [ ] Firebase admin credentials
* [ ] private keys
* [ ] passwords
* [ ] tokens
* [ ] test credentials
* [ ] hardcoded authentication credentials

Verify:

* [ ] HTTPS used
* [ ] No insecure HTTP production endpoints
* [ ] Sensitive operations occur server-side
* [ ] Authentication is secure
* [ ] Authorization is enforced server-side
* [ ] Tokens handled securely
* [ ] Tokens expire appropriately
* [ ] Refresh tokens handled correctly
* [ ] Sensitive information is not logged
* [ ] Sensitive information is not stored insecurely
* [ ] Debug endpoints are disabled
* [ ] Test endpoints are disabled
* [ ] Production database is not directly exposed

---

# 10. API SECURITY

Inspect all API integrations.

Verify:

```text
Flutter
   ↓
HTTPS
   ↓
Backend
   ↓
Database
```

Check:

* [ ] HTTPS
* [ ] Authentication
* [ ] Authorization
* [ ] Token expiration
* [ ] Refresh token handling
* [ ] API timeout handling
* [ ] Retry handling
* [ ] Rate limiting where appropriate
* [ ] Input validation
* [ ] Server-side validation
* [ ] Server-side permissions
* [ ] Proper HTTP status handling
* [ ] Secure error messages

Ensure backend errors do not expose:

* database details
* stack traces
* secrets
* internal infrastructure
* authentication information

---

# 11. FIREBASE AUDIT

If Firebase is used, inspect:

```text
google-services.json
Firebase configuration
FCM
Crashlytics
Analytics
Authentication
App Check
```

Verify:

* [ ] Correct production Firebase project
* [ ] Correct Android package name
* [ ] Correct Firebase Android app
* [ ] Correct `google-services.json`
* [ ] Firebase Authentication configured
* [ ] FCM configured
* [ ] Crashlytics configured
* [ ] Analytics configured if required
* [ ] App Check configured if appropriate
* [ ] No Firebase admin credentials inside app

---

# 12. NOTIFICATION AUDIT

If notifications exist, test the entire notification lifecycle.

Verify:

* [ ] Notification permission
* [ ] FCM token generation
* [ ] Token refresh
* [ ] Token stored correctly
* [ ] Backend can send notifications
* [ ] Foreground notifications
* [ ] Background notifications
* [ ] Terminated-app notifications
* [ ] Notification channels
* [ ] Notification priority
* [ ] Notification sound
* [ ] Badge behavior where applicable
* [ ] Notification tap handling
* [ ] Deep linking
* [ ] Logged-out behavior
* [ ] Multiple-device behavior

Test:

```text
Backend event
    ↓
FCM
    ↓
Android
    ↓
Notification
    ↓
User taps
    ↓
Correct app screen
```

Verify that notification taps never open the wrong screen.

---

# 13. ANDROID PERMISSIONS

Inspect:

```text
AndroidManifest.xml
```

List every permission.

For each permission determine:

1. Why is it required?
2. Which feature uses it?
3. Is it required for Play Store functionality?
4. Is runtime permission required?
5. Is the permission requested only when needed?

Audit:

* [ ] Camera
* [ ] Location
* [ ] Notifications
* [ ] Microphone
* [ ] Photos/media
* [ ] Contacts
* [ ] Bluetooth
* [ ] Phone
* [ ] SMS
* [ ] Storage
* [ ] Background location
* [ ] Other sensitive permissions

Remove unnecessary permissions only after verifying that no application feature depends on them.

---

# 14. PRIVACY

Determine what user data the application collects.

Examples:

```text
Name
Email
Phone
Location
Photos
Contacts
Device information
Analytics
Usage data
Payment-related information
```

Verify:

* [ ] Privacy policy exists
* [ ] Privacy policy is publicly accessible
* [ ] Privacy policy matches actual behavior
* [ ] Data collection is documented
* [ ] Data sharing is documented
* [ ] Data retention is understood
* [ ] Data deletion process exists where required
* [ ] Third-party SDK data collection is understood

Do not claim that the application does not collect data without auditing the actual implementation and SDKs.

---

# 15. GOOGLE PLAY DATA SAFETY

Prepare a Data Safety audit.

Determine:

```text
What data is collected?
What data is shared?
Why is it collected?
Is collection optional or required?
Is data encrypted?
Can the user request deletion?
Which SDKs collect data?
```

Cross-check:

* Flutter code
* backend
* Firebase
* analytics
* crash reporting
* payment SDK
* maps SDK
* advertising SDK
* other third-party SDKs

Do not submit inaccurate declarations.

---

# 16. ACCOUNT DELETION

If users can create accounts:

Verify:

* [ ] Account deletion feature exists where required
* [ ] User can initiate deletion
* [ ] Backend handles deletion correctly
* [ ] Sessions/tokens are revoked
* [ ] Associated user data is handled correctly
* [ ] Privacy policy explains deletion
* [ ] Play Console requirements are satisfied

Test:

```text
Create account
      ↓
Use application
      ↓
Request deletion
      ↓
Account deleted/deactivated
      ↓
Session revoked
      ↓
User cannot continue using deleted account
```

---

# 17. AUTHENTICATION

Test:

* [ ] Signup
* [ ] Login
* [ ] Logout
* [ ] Forgot password
* [ ] Password reset
* [ ] Email verification if applicable
* [ ] Phone verification if applicable
* [ ] Token expiration
* [ ] Refresh token
* [ ] Session restoration
* [ ] Multiple devices
* [ ] Invalid credentials
* [ ] Account disabled
* [ ] Deleted account
* [ ] Network failure
* [ ] Server failure

Check that sensitive authentication information is not logged.

---

# 18. PAYMENT AUDIT

If payments exist, test:

* [ ] Successful payment
* [ ] Failed payment
* [ ] Cancelled payment
* [ ] Payment timeout
* [ ] Network failure
* [ ] Duplicate payment
* [ ] App killed during payment
* [ ] Payment callback
* [ ] Webhook
* [ ] Payment verification
* [ ] Refund
* [ ] Partial refund if applicable
* [ ] Payment history

IMPORTANT:

Payment success must be verified server-side.

Do not trust only a client-side success callback.

---

# 19. DEEP LINKS

If deep links/app links exist, test:

```text
App installed
App not installed
App running
App killed
User logged in
User logged out
Invalid link
Expired link
```

Verify every link opens the correct destination.

---

# 20. OFFLINE / NETWORK TESTING

Test:

* [ ] Wi-Fi
* [ ] 4G
* [ ] 5G
* [ ] Slow network
* [ ] No internet
* [ ] Internet drops during API call
* [ ] Network switches
* [ ] Server timeout
* [ ] Server unavailable

Every important API flow should have:

```text
Loading
Success
Error
Retry
Empty
Offline
```

where applicable.

The application must not freeze indefinitely.

---

# 21. UI/UX PRODUCTION AUDIT

For every major screen check:

* [ ] Loading state
* [ ] Empty state
* [ ] Error state
* [ ] Success state
* [ ] Offline state
* [ ] Form validation
* [ ] Disabled buttons
* [ ] Keyboard behavior
* [ ] Back navigation
* [ ] Long text
* [ ] Small screen
* [ ] Large screen
* [ ] Dark mode if supported
* [ ] Light mode
* [ ] Accessibility
* [ ] Font scaling
* [ ] Touch targets
* [ ] Scroll behavior

Check for:

* overflow
* clipped text
* broken layouts
* invisible buttons
* incorrect padding
* keyboard covering fields
* broken navigation
* broken dialogs
* broken bottom sheets

---

# 22. DEVICE TESTING

Test on multiple Android versions supported by the application.

Test:

* [ ] Low-end device
* [ ] Mid-range device
* [ ] High-end device
* [ ] Small screen
* [ ] Large screen
* [ ] Different Android versions
* [ ] Different screen densities

If tablets are supported:

* [ ] Tablet layout
* [ ] Large-screen layout
* [ ] Orientation behavior

---

# 23. LIFECYCLE TESTING

Test:

```text
Fresh install
First launch
Background
Foreground
App killed
App reopened
Screen locked
Phone unlocked
Process killed
Low memory
```

Test during:

* login
* payment
* booking/order
* API request
* file upload
* notification
* navigation

---

# 24. APP UPDATE TESTING

This is mandatory.

Test:

```text
Old production version
        ↓
Install
        ↓
Use application
        ↓
Upgrade to new release
        ↓
Verify existing data
        ↓
Verify authentication
        ↓
Verify local storage
        ↓
Verify database migrations
```

Check for:

* [ ] Data migration
* [ ] SharedPreferences compatibility
* [ ] Secure storage compatibility
* [ ] SQLite/database migration
* [ ] Authentication state
* [ ] Cached data
* [ ] Notification token
* [ ] Deep links
* [ ] App configuration

---

# 25. PERFORMANCE AUDIT

Check:

* [ ] Startup time
* [ ] Memory usage
* [ ] CPU usage
* [ ] Large images
* [ ] Network requests
* [ ] List scrolling
* [ ] Animations
* [ ] Battery usage
* [ ] Background processing
* [ ] App size

Look for:

* unnecessary rebuilds
* memory leaks
* oversized images
* excessive API calls
* expensive operations on UI thread
* unnecessary background work

---

# 26. CRASH MONITORING

If Firebase Crashlytics or another crash service is used:

Verify:

* [ ] Crash reporting enabled in release
* [ ] Production app correctly identified
* [ ] Test crash reaches dashboard
* [ ] Sensitive information is not logged
* [ ] Non-fatal errors monitored where useful

---

# 27. ANALYTICS

If analytics are required, verify production events.

Examples:

```text
app_open
signup
login
search
view_item
add_to_cart
checkout_started
payment_success
booking_created
booking_cancelled
logout
```

Verify:

* [ ] Events fire correctly
* [ ] No duplicate events
* [ ] No sensitive personal data is accidentally sent
* [ ] Production analytics project is used

---

# 28. APP ICON

Verify:

* [ ] Production icon
* [ ] Adaptive icon
* [ ] Foreground icon
* [ ] Background configuration
* [ ] No development icon
* [ ] No clipping
* [ ] Correct appearance on different launchers

---

# 29. SPLASH SCREEN

Verify:

* [ ] Production branding
* [ ] Correct logo
* [ ] Correct background
* [ ] No development branding
* [ ] No excessive splash delay
* [ ] App loads correctly after splash

---

# 30. STORE LISTING PREPARATION

Prepare:

* [ ] App name
* [ ] Short description
* [ ] Full description
* [ ] App icon
* [ ] Screenshots
* [ ] Feature graphic
* [ ] Category
* [ ] Contact email
* [ ] Privacy policy
* [ ] Website if applicable

All screenshots must represent the actual production application.

---

# 31. GOOGLE PLAY POLICY REVIEW

Check the application against applicable Google Play policies.

Verify:

* [ ] No misleading claims
* [ ] No prohibited content
* [ ] Permissions justified
* [ ] Privacy disclosures accurate
* [ ] Data Safety accurate
* [ ] Account deletion requirements satisfied
* [ ] Copyright/licensing checked
* [ ] Third-party SDK compliance checked
* [ ] Payment rules checked if applicable
* [ ] User-generated content rules checked if applicable
* [ ] Location rules checked if applicable

If there is uncertainty, flag it for manual review instead of guessing.

---

# 32. RELEASE BUILD

Before building:

```bash
flutter clean
flutter pub get
flutter analyze
flutter test
```

Then:

```bash
flutter build appbundle --release
```

Verify:

```text
build/app/outputs/bundle/release/
```

Check:

* [ ] AAB generated successfully
* [ ] Release signing applied
* [ ] Correct application ID
* [ ] Correct version
* [ ] Correct target SDK
* [ ] Production configuration
* [ ] No debug configuration
* [ ] No test configuration

---

# 33. RELEASE BUILD TESTING

Do NOT upload the first successful AAB directly to production.

Test the release build.

Minimum flow:

```text
Install
   ↓
Launch
   ↓
Signup
   ↓
Login
   ↓
Main functionality
   ↓
API
   ↓
Notifications
   ↓
Payment if applicable
   ↓
Logout
   ↓
Login again
   ↓
Kill app
   ↓
Reopen app
```

---

# 34. GOOGLE PLAY TESTING TRACKS

Recommended release path:

```text
Internal Testing
       ↓
Closed Testing
       ↓
Production
```

Use internal/closed testing to identify:

* crashes
* signing issues
* permissions
* notifications
* deep links
* API problems
* device-specific issues
* Play policy issues

---

# 35. GIT / SOURCE CONTROL AUDIT

Verify no secrets are committed.

Search Git history and current files for:

* API secrets
* private keys
* passwords
* tokens
* keystores
* Firebase admin credentials
* production credentials

Check:

```bash
git status
git ls-files
```

Do not expose secret values in the audit report.

If secrets have previously been committed, flag them as compromised and recommend rotation.

---

# 36. CI/CD

If CI/CD exists, inspect it.

Verify:

* [ ] Production build works
* [ ] Signing handled securely
* [ ] Secrets stored in CI secret manager
* [ ] No credentials committed
* [ ] Versioning works
* [ ] Release artifacts generated correctly
* [ ] Tests run before release
* [ ] Build failures are visible

---

# 37. FINAL PRODUCTION BUILD GATE

Before declaring READY, verify all of these:

```text
☐ Flutter project healthy
☐ Tests passing
☐ Analyzer clean
☐ Production API
☐ Production database
☐ Production Firebase
☐ Production payment
☐ Production notifications
☐ Production analytics
☐ Crash monitoring
☐ HTTPS
☐ Security audit complete
☐ No secrets in source
☐ Correct application ID
☐ Correct version
☐ Correct target API
☐ Release signing
☐ Play App Signing
☐ Permissions reviewed
☐ Privacy policy
☐ Data Safety
☐ Account deletion
☐ Authentication tested
☐ Payment tested
☐ Notifications tested
☐ Deep links tested
☐ Offline behavior tested
☐ UI tested
☐ Device testing completed
☐ Performance checked
☐ Update testing completed
☐ Store assets ready
☐ Play policy review completed
☐ Release AAB generated
☐ Internal testing completed
☐ Closed testing completed if required
☐ Production release approved
```

---

# 38. CLAUDE'S REQUIRED AUDIT REPORT

After completing the audit, DO NOT simply say:

> "Everything looks good."

Generate a detailed report:

## A. Project Summary

```text
Flutter Version:
Dart Version:
Android Gradle Plugin:
Gradle:
Kotlin:
Java:
Compile SDK:
Target SDK:
Min SDK:
Application ID:
Current Version:
Build Number:
```

## B. Status

Use:

```text
🟢 PASS
🟡 WARNING
🔴 FAIL
⚪ NOT APPLICABLE
```

Create a table:

| Area             | Status | Finding | Action |
| ---------------- | ------ | ------- | ------ |
| Flutter          |        |         |        |
| Android          |        |         |        |
| Signing          |        |         |        |
| Security         |        |         |        |
| Firebase         |        |         |        |
| Notifications    |        |         |        |
| Permissions      |        |         |        |
| Privacy          |        |         |        |
| Data Safety      |        |         |        |
| Account Deletion |        |         |        |
| Authentication   |        |         |        |
| Payments         |        |         |        |
| Deep Links       |        |         |        |
| Performance      |        |         |        |
| Testing          |        |         |        |
| Store Listing    |        |         |        |
| Play Policy      |        |         |        |

---

# 39. PRIORITY CLASSIFICATION

Every finding must have a priority.

```text
P0 — BLOCKER
Cannot publish.

P1 — CRITICAL
Should be fixed before production.

P2 — IMPORTANT
Should be fixed before release if possible.

P3 — IMPROVEMENT
Can be handled after launch.
```

Examples:

### P0

* Production signing broken
* Wrong application ID
* Production API unavailable
* Critical security vulnerability
* Release build fails
* Payment fundamentally broken

### P1

* Notifications broken
* Account deletion missing where required
* Incorrect Data Safety information
* Production Firebase misconfigured
* Authentication problems

### P2

* Minor UI issue
* Non-critical performance issue
* Analytics event missing

### P3

* Refactoring
* Code cleanup
* Minor UX improvements

---

# 40. IMPLEMENTATION RULES

When fixing issues:

### Safe to fix automatically

Examples:

* analyzer warnings
* unused imports
* obvious debug logs
* incorrect release configuration
* missing `.gitignore` entries
* obvious production URL configuration mistakes after verification
* release build configuration issues

### Require confirmation before changing

Examples:

* application ID
* package name
* signing keys
* keystore
* Firebase project
* production database
* payment provider
* backend architecture
* authentication architecture
* major dependency upgrades
* Gradle major upgrades
* Kotlin major upgrades
* SDK major upgrades
* database migrations
* API contracts

Never make destructive production changes without explicit approval.

---

# 41. FINAL OUTPUT FORMAT

At the end provide:

## Production Readiness

```text
STATUS: READY / NOT READY
```

## Blocking Issues

List all P0/P1 issues.

## Warnings

List P2 issues.

## Improvements

List P3 issues.

## Changes Made

List every file changed and why.

Example:

```text
android/app/build.gradle.kts
- Updated release configuration

.gitignore
- Added signing credentials protection
```

## Commands Executed

List commands that were actually executed.

## Build Result

```text
flutter analyze:
flutter test:
flutter build appbundle --release:
```

## Final Recommendation

Clearly state one of:

```text
🟢 READY FOR INTERNAL TESTING

🟡 READY FOR CLOSED TESTING

🔴 NOT READY FOR PLAY STORE

🟢 READY FOR PRODUCTION RELEASE
```

Do not declare production-ready if any P0/P1 issue remains.

---

# 42. IMPORTANT FINAL RULE

The objective is NOT simply to make the project compile.

The objective is to make the application:

```text
SECURE
+
STABLE
+
TESTED
+
PRODUCTION CONFIGURED
+
PLAY STORE COMPLIANT
+
MONITORED
+
UPDATABLE
+
MAINTAINABLE
```

Therefore, perform a **real production audit**, not just a build check.

Do not hide problems.

Do not guess.

Do not silently change critical configuration.

Report every important finding clearly.

Only declare the app production-ready when the evidence supports it.
