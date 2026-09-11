import '../config/api_config.dart';
import '../models/activity_model.dart';
import 'api_service.dart';

class ActivityService {
  static List<ActivityModel> _cachedActivities = [];

  static List<ActivityModel> get cachedActivities => List.unmodifiable(_cachedActivities);

  Future<List<ActivityModel>> fetchActivities({
    String? category,
    String? destination,
    String? search,
    bool forceRefresh = false,
  }) async {
    final bool isDefaultQuery =
        (category == null || category == 'All' || category.isEmpty) &&
        (destination == null || destination.isEmpty) &&
        (search == null || search.isEmpty);

    if (!forceRefresh && isDefaultQuery && _cachedActivities.isNotEmpty) {
      // Return cached activities instantly (0ms delay) and update in background
      _fetchFromNetwork(category: category, destination: destination, search: search);
      return _filterList(_cachedActivities, category: category, destination: destination, search: search);
    }

    return await _fetchFromNetwork(category: category, destination: destination, search: search);
  }

  Future<List<ActivityModel>> _fetchFromNetwork({
    String? category,
    String? destination,
    String? search,
  }) async {
    List<ActivityModel> result = [];
    try {
      final Map<String, String> queryParams = {'limit': '100'};
      if (destination != null && destination.isNotEmpty) {
        queryParams['destination'] = destination;
      }
      if (category != null && category.isNotEmpty && category != 'All') {
        queryParams['category'] = category;
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final uri = Uri.parse(ApiConfig.activities).replace(queryParameters: queryParams);

      final response = await ApiService.get(uri.toString());
      if (response is Map && (response['success'] == true || response['data'] != null)) {
        final dataField = response['data'] ?? response['activities'];
        if (dataField is List) {
          result = dataField.map((item) => ActivityModel.fromJson(item)).toList();
          if ((category == null || category == 'All' || category.isEmpty) &&
              (destination == null || destination.isEmpty) &&
              (search == null || search.isEmpty)) {
            _cachedActivities = result;
          }
        }
      }
    } catch (_) {}

    if (result.isEmpty && _cachedActivities.isNotEmpty) {
      result = _cachedActivities;
    }

    return _filterList(result, category: category, destination: destination, search: search);
  }

  List<ActivityModel> _filterList(List<ActivityModel> list, {String? category, String? destination, String? search}) {
    return list.where((a) {
      if (category != null && category.trim().isNotEmpty && category != 'All') {
        final actCat = a.category.trim().toLowerCase();
        final selCat = category.trim().toLowerCase();
        if (actCat != selCat && !actCat.contains(selCat) && !selCat.contains(actCat)) {
          return false;
        }
      }
      if (destination != null && destination.trim().isNotEmpty) {
        final cleanDest = destination.split(',')[0].trim().toLowerCase().replaceAll('beaches', '').trim();
        final tokens = cleanDest.split(RegExp(r'[\s&]+')).where((t) => t.length >= 3).toList();

        final destMatch = a.destinationId == destination ||
            a.destinationName.toLowerCase().contains(cleanDest) ||
            cleanDest.contains(a.destinationName.toLowerCase()) ||
            a.location.toLowerCase().contains(cleanDest) ||
            a.title.toLowerCase().contains(cleanDest) ||
            (tokens.isNotEmpty && tokens.any((tok) =>
                a.destinationName.toLowerCase().contains(tok) ||
                a.location.toLowerCase().contains(tok) ||
                a.title.toLowerCase().contains(tok)));

        if (!destMatch) return false;
      }
      if (search != null && search.trim().isNotEmpty) {
        final q = search.trim().toLowerCase();
        final matches = a.title.toLowerCase().contains(q) ||
            a.location.toLowerCase().contains(q) ||
            a.destinationName.toLowerCase().contains(q) ||
            a.overview.toLowerCase().contains(q);
        if (!matches) return false;
      }
      return true;
    }).toList();
  }
}
