import type { Place } from '../types/place';
import { mockReviews } from './mockReviews';

type PlaceWithoutStats = Omit<Place, 'rating' | 'reviewCount'>;

// Rating and review count come from the sample reviews so the numbers always match.
function withReviewStats(place: PlaceWithoutStats): Place {
  const ratings = mockReviews.filter((r) => r.placeId === place.id).map((r) => r.rating);
  const average = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  return { ...place, rating: Math.round(average * 10) / 10, reviewCount: ratings.length };
}

// Sample data only. Coordinates are approximate; images are illustrations in public/images/places. Replace with API data in "UI: Connect pages to the backend API".
const places: PlaceWithoutStats[] = [
  {
    id: 'denton-public-library',
    name: 'Denton Public Library',
    category: 'library',
    city: 'Denton, TX',
    address: '502 Oakland St, Denton, TX 76201',
    description: 'Large reading rooms with quiet zones and plenty of individual seating.',
    hours: 'Open until 9:00 PM',
    imageUrl: '/images/places/denton-public-library.svg',
    photos: [{ url: '/images/places/denton-public-library.svg', alt: 'Illustration of a quiet library reading room with tall bookshelves and a reading lamp' }],
    location: { lat: 33.219, lng: -97.1335 },
    sensory: { noise: 'low', lighting: 'dim', crowd: 'low', temperature: 'Comfortable', scents: 'Minimal' },
    accessibility: { wheelchair: true, sensoryRoom: true },
  },
  {
    id: 'north-lakes-park',
    name: 'North Lakes Park',
    category: 'park',
    city: 'Denton, TX',
    address: '2001 W Windsor Dr, Denton, TX 76209',
    description: 'Open green space with walking trails and shaded areas away from the sports fields.',
    hours: 'Open until 11:00 PM',
    imageUrl: '/images/places/north-lakes-park.svg',
    photos: [{ url: '/images/places/north-lakes-park.svg', alt: 'Illustration of a sunny park with trees, a walking path, a bench, and a pond' }],
    location: { lat: 33.2366, lng: -97.164 },
    sensory: { noise: 'low', lighting: 'normal', crowd: 'moderate', temperature: 'Varies with weather', scents: 'Minimal' },
    accessibility: { wheelchair: true, sensoryRoom: false },
  },
  {
    id: 'harmony-coffee',
    name: 'Harmony Coffee',
    category: 'cafe',
    city: 'Denton, TX',
    address: '123 Maple Ave, Denton, TX 76201',
    description: 'A cozy local coffee shop with a calm atmosphere and plenty of seating. Popular for quiet study time.',
    hours: 'Open until 8:00 PM',
    imageUrl: '/images/places/harmony-coffee.svg',
    photos: [{ url: '/images/places/harmony-coffee.svg', alt: 'Illustration of a cozy coffee shop with a counter, hanging lamps, and a small table' }],
    location: { lat: 33.2148, lng: -97.1331 },
    sensory: { noise: 'moderate', lighting: 'bright', crowd: 'moderate', temperature: 'Comfortable', scents: 'Strong coffee aroma' },
    accessibility: { wheelchair: true, sensoryRoom: false },
  },
  {
    id: 'unt-art-gallery',
    name: 'UNT Art Gallery',
    category: 'museum',
    city: 'Denton, TX',
    address: '1201 W Mulberry St, Denton, TX 76201',
    description: 'Small rotating exhibits with soft lighting. Weekday mornings are the calmest.',
    hours: 'Open until 5:00 PM',
    imageUrl: '/images/places/unt-art-gallery.svg',
    photos: [{ url: '/images/places/unt-art-gallery.svg', alt: 'Illustration of a calm art gallery with framed paintings, soft spotlights, and a sculpture' }],
    location: { lat: 33.2107, lng: -97.1475 },
    sensory: { noise: 'low', lighting: 'dim', crowd: 'low', temperature: 'Cool', scents: 'Minimal' },
    accessibility: { wheelchair: true, sensoryRoom: false },
  },
  {
    id: 'square-burger-co',
    name: 'Square Burger Co.',
    category: 'restaurant',
    city: 'Denton, TX',
    address: '210 W Hickory St, Denton, TX 76201',
    description: 'Busy downtown spot with music and an open kitchen. Patio seating is quieter.',
    hours: 'Open until 10:00 PM',
    imageUrl: '/images/places/square-burger-co.svg',
    photos: [{ url: '/images/places/square-burger-co.svg', alt: 'Illustration of a busy restaurant with brick walls, string lights, tables, and an open kitchen' }],
    location: { lat: 33.2149, lng: -97.135 },
    sensory: { noise: 'high', lighting: 'bright', crowd: 'high', temperature: 'Warm', scents: 'Strong cooking smells' },
    accessibility: { wheelchair: true, sensoryRoom: false },
  },
  {
    id: 'calm-corner-books',
    name: 'Calm Corner Books',
    category: 'store',
    city: 'Denton, TX',
    address: '88 Elm St, Denton, TX 76201',
    description: 'Independent bookstore with a reading nook and a quiet hour every Tuesday morning.',
    hours: 'Open until 7:00 PM',
    imageUrl: '/images/places/calm-corner-books.svg',
    photos: [{ url: '/images/places/calm-corner-books.svg', alt: 'Illustration of an independent bookstore with a striped awning and books in the window' }],
    location: { lat: 33.2165, lng: -97.132 },
    sensory: { noise: 'low', lighting: 'normal', crowd: 'low', temperature: 'Comfortable', scents: 'Minimal' },
    accessibility: { wheelchair: false, sensoryRoom: true },
  },
];

export const mockPlaces: Place[] = places.map(withReviewStats);
