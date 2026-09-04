import '../config/api_config.dart';
import '../models/banner_model.dart';
import 'api_service.dart';

class BannerService {
  Future<List<BannerModel>> getBanners() async {
    try {
      final response = await ApiService.get(ApiConfig.banners);
      if (response['success'] == true && response['data'] != null) {
        final List list = response['data'];
        return list.map((json) => BannerModel.fromJson(json)).toList();
      }
      return _getFallbackBanners();
    } catch (_) {
      return _getFallbackBanners();
    }
  }

  List<BannerModel> getBannersSync() {
    return _getFallbackBanners();
  }

  List<BannerModel> _getFallbackBanners() {
    return [
      BannerModel(
        id: 'b1',
        title: 'Rajasthan Royal Forts Tour',
        subtitle: 'Experience the Royalty — Heritage, Culture & Forts of India',
        imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
        offerText: 'Limited Offer',
        priceText: '₹13,999',
        durationText: 'Per Person Only',
        destinationName: 'Rajasthan',
        destinationSlug: 'rajasthan',
      ),
      BannerModel(
        id: 'b2',
        title: 'Hyderabad Tour',
        subtitle: 'Discover the City of Nizams — Culture, Heritage & Biryani',
        imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
        offerText: 'Limited Offer',
        priceText: '₹12,999',
        durationText: 'Per Person Only',
        destinationName: 'Hyderabad',
        destinationSlug: 'telagana',
      ),
      BannerModel(
        id: 'b3',
        title: 'Kashmir — Heaven on Earth',
        subtitle: 'Shikara Rides · Dal Lake · Snow-capped Peaks',
        imageUrl: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
        offerText: 'Starting From',
        priceText: '₹14,999',
        durationText: 'Per Person Only',
        destinationName: 'Kashmir',
        destinationSlug: 'kashmir',
      ),
      BannerModel(
        id: 'b4',
        title: 'Himachal & Manali Peaks',
        subtitle: 'Duration 03 Night / 04 Days — Solang Valley · Rohtang Pass',
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
        offerText: 'OfferCard',
        priceText: '13000',
        durationText: 'Per Person Only',
        destinationName: 'Manali',
        destinationSlug: 'himachal',
      ),
      BannerModel(
        id: 'b5',
        title: 'Delhi → Agra → Jaipur',
        subtitle: 'Golden Triangle & Agra — Taj Mahal · Amer Fort · Hawa Mahal',
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
        offerText: 'Heritage Tour',
        priceText: '₹15,999',
        durationText: 'Per Person Only',
        destinationName: 'Golden Triangle',
        destinationSlug: 'golden-triangle',
      ),
      BannerModel(
        id: 'b6',
        title: 'Goa Beaches & Nightlife',
        subtitle: 'Duration 03 Night / 04 Days — Beach · Water Sports · Sunsets',
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
        offerText: 'Limited Offer',
        priceText: '₹16,000',
        durationText: 'Per Person Only',
        destinationName: 'Goa',
        destinationSlug: 'goa',
      ),
      BannerModel(
        id: 'b7',
        title: 'Telangana Heritage Tour',
        subtitle: 'Charminar · Golconda Fort · Ramoji Film City · Hussain Sagar',
        imageUrl: 'https://images.unsplash.com/photo-1572443490709-e13e9a8e3a2a?q=80&w=2000&auto=format&fit=crop',
        targetSection: 'HeroBanner',
        offerText: 'Limited Offer',
        priceText: '₹11,900',
        durationText: 'Per Person Only',
        destinationName: 'Telangana',
        destinationSlug: 'telagana',
      ),
    ];
  }
}
