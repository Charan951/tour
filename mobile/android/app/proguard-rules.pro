# ── Flutter ──────────────────────────────────────────────────────────
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# ── Razorpay (checkout uses reflection + a JS bridge) ────────────────
# https://razorpay.com/docs/payments/payment-gateway/android-integration/standard/build-integration/
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
  public void onPayment*(...);
}
# Google Pay in-app (optional dependency pulled by Razorpay)
-dontwarn com.google.android.apps.nbu.paisa.inapp.**

# ── Keep model classes with @Keep ───────────────────────────────────
-keep,allowobfuscation @interface androidx.annotation.Keep
-keep @androidx.annotation.Keep class * { *; }
-keepclassmembers class * {
    @androidx.annotation.Keep *;
}

# ── Misc plugins (consumer rules usually cover these; belt & braces) ─
-dontwarn org.slf4j.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
