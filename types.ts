export enum AppRoute {
  HOME = 'home',
  CREATE = 'create',
  SOCIAL = 'social',
  PROFILE = 'profile',
  AUTH = 'auth',
  PLAN_DETAIL = 'plan_detail' // New route for viewing a specific plan
}

export enum TransportType {
  WALK = 'walk',
  TAXI = 'taxi',
  BUS = 'bus',
  TRAIN = 'train',
  METRO = 'metro',
  HELICOPTER = 'helicopter',
  FLIGHT = 'flight'
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface TransportOption {
  type: TransportType;
  durationMinutes: number;
  cost: number;
  recommended: boolean;
}

export interface AccommodationOption {
  name: string;
  image: string; // Placeholder URL based on name
  pricePerNight: number;
  rating: number; // 1-5
  address: string;
  recommended: boolean;
}

export interface ItineraryItem {
  id: string;
  type: 'place' | 'lunch' | 'transport' | 'accommodation';
  title: string;
  description?: string;
  durationMinutes?: number;
  cost?: number;
  location?: GeoLocation;
  photos?: string[]; // User added photos
  // Transport specific
  transportType?: TransportType;
  transportOptions?: TransportOption[];
  // Accommodation specific
  accommodationOptions?: AccommodationOption[];
}

export interface TripPlan {
  id: string;
  destination: string;
  days: number;
  budget: number;
  startDate: string;
  items: ItineraryItem[];
  status: 'planning' | 'upcoming' | 'completed';
  coverImage: string;
  authorId: string;
  authorName: string;
}

export interface BucketItem {
  id: string;
  text: string;
  isCompleted: boolean;
  type: 'place' | 'note';
  location?: string; // Associated city/area
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  image: string; // Primary image
  images?: string[]; // Multiple images
  caption: string;
  likes: number;
  comments: number;
  tripPlanId?: string; // Linked plan that can be imported
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  tripsCount: number;
}

export interface NearbyTraveler {
  id: string;
  name: string;
  lat: number;
  lng: number;
  avatar: string;
}