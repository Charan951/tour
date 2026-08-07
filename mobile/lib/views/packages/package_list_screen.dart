import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/package_provider.dart';
import '../../widgets/package_card.dart';
import 'package_detail_screen.dart';

class PackageListScreen extends StatelessWidget {
  const PackageListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final packageProvider = Provider.of<PackageProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore Packages'),
      ),
      body: RefreshIndicator(
        onRefresh: () => packageProvider.fetchPackages(),
        child: packageProvider.isLoading
            ? const Center(child: CircularProgressIndicator())
            : packageProvider.packages.isEmpty
                ? const Center(
                    child: Text('No holiday packages available.'),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: packageProvider.packages.length,
                    itemBuilder: (context, index) {
                      final pkg = packageProvider.packages[index];
                      return PackageCard(
                        package: pkg,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => PackageDetailScreen(package: pkg),
                            ),
                          );
                        },
                      );
                    },
                  ),
      ),
    );
  }
}
