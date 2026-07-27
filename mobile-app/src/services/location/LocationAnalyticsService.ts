import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationAnalytics {
  visits: number;
  navigationClicks: number;
  searches: number;
  mostVisitedCenterId: string | null;
  averageTravelDistance: number;
  favoriteWasteCategory: string | null;
  centerVisits: Record<string, number>;
  wasteSearches: Record<string, number>;
  totalTravelDistance: number;
}

const ANALYTICS_STORAGE_KEY = '@ecosnap_location_analytics';

class LocationAnalyticsServiceImpl {
  private analytics: LocationAnalytics = {
    visits: 0,
    navigationClicks: 0,
    searches: 0,
    mostVisitedCenterId: null,
    averageTravelDistance: 0,
    favoriteWasteCategory: null,
    centerVisits: {},
    wasteSearches: {},
    totalTravelDistance: 0,
  };

  constructor() {
    this.loadAnalytics();
  }

  private async loadAnalytics() {
    try {
      const data = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (data) {
        this.analytics = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load location analytics', error);
    }
  }

  private async saveAnalytics() {
    try {
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.analytics));
    } catch (error) {
      console.error('Failed to save location analytics', error);
    }
  }

  async trackVisit(centerId: string, distanceKm: number) {
    this.analytics.visits += 1;
    this.analytics.totalTravelDistance += distanceKm;
    this.analytics.averageTravelDistance = this.analytics.totalTravelDistance / this.analytics.visits;

    if (!this.analytics.centerVisits[centerId]) {
      this.analytics.centerVisits[centerId] = 0;
    }
    this.analytics.centerVisits[centerId] += 1;

    // Update most visited
    let maxVisits = 0;
    let mostVisitedId = null;
    for (const [id, visits] of Object.entries(this.analytics.centerVisits)) {
      if (visits > maxVisits) {
        maxVisits = visits;
        mostVisitedId = id;
      }
    }
    this.analytics.mostVisitedCenterId = mostVisitedId;

    await this.saveAnalytics();
  }

  async trackNavigationClick() {
    this.analytics.navigationClicks += 1;
    await this.saveAnalytics();
  }

  async trackSearch(wasteCategory: string) {
    this.analytics.searches += 1;

    if (!this.analytics.wasteSearches[wasteCategory]) {
      this.analytics.wasteSearches[wasteCategory] = 0;
    }
    this.analytics.wasteSearches[wasteCategory] += 1;

    // Update favorite category
    let maxSearches = 0;
    let favCategory = null;
    for (const [cat, searches] of Object.entries(this.analytics.wasteSearches)) {
      if (searches > maxSearches) {
        maxSearches = searches;
        favCategory = cat;
      }
    }
    this.analytics.favoriteWasteCategory = favCategory;

    await this.saveAnalytics();
  }

  getAnalytics(): LocationAnalytics {
    return { ...this.analytics };
  }
}

export const LocationAnalyticsService = new LocationAnalyticsServiceImpl();
