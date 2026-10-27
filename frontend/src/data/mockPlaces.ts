
import type { LocatedPlace } from '../types/place';
import { mockReviews } from './mockReviews';

// Every mock place has a map position.
type PlaceWithoutStats = Omit<LocatedPlace, 'rating' | 'reviewCount'>;

function withReviewStats(place: PlaceWithoutStats): LocatedPlace {
  const ratings = mockReviews
    .filter((review) => review.placeId === place.id)
    .map((review) => review.rating);

  const average = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : 0;

  return {
    ...place,
    rating: Math.round(average * 10) / 10,
    reviewCount: ratings.length,
  };
}

// Real venues for the Sensory Scout demonstration.
// Sensory levels below are DEMO VALUES, not verified observations.
// Coordinates are based on the selected map locations.
const places: PlaceWithoutStats[] = [
  {
    id: 'denton-public-library',
    name: 'Emily Fowler Central Library',
    category: 'library',
    city: 'Denton, TX',
    address: '502 Oakland St, Denton, TX 76201',
    description:
      'A public library operated by the City of Denton. Check the official library website for current services, hours, and visitor information.',
    hours: 'See official library hours',
    location: { lat: 33.21863601456154, lng: -97.13008743253772 },
    sensory: {
      noise: 'low',
      lighting: 'normal',
      crowd: 'moderate',
      temperature: 'Not verified',
      scents: 'Not verified',
    },
    accessibility: {},
  },
  {
    id: 'north-lakes-park',
    name: 'North Lakes Park',
    category: 'park',
    city: 'Denton, TX',
    address: '2001 W Windsor Dr, Denton, TX',
    description:
      'A City of Denton park with outdoor recreation areas, trails, and open space. Conditions vary with weather, events, and activity.',
    hours: 'Check City of Denton park information',
    location: { lat: 33.23981, lng: -97.15225 },
    sensory: {
      noise: 'moderate',
      lighting: 'normal',
      crowd: 'moderate',
      temperature: 'Depends on weather',
      scents: 'Not verified',
    },
    accessibility: {},
  },
  {
    id: 'harmony-coffee',
    name: 'Jupiter House',
    category: 'cafe',
    city: 'Denton, TX',
    address: '106 N Locust St, Denton, TX 76201',
    description:
      'A coffee shop in downtown Denton. Noise, lighting, seating, and crowd levels may vary throughout the day.',
    hours: 'Check current business hours',
    location: { lat: 33.21500606757385, lng: -97.13223691534338 },
    sensory: {
      noise: 'moderate',
      lighting: 'normal',
      crowd: 'moderate',
      temperature: 'Not verified',
      scents: 'Not verified',
    },
    accessibility: {},
  },
  {
    id: 'unt-art-gallery',
    name: 'UNT Art Building',
    category: 'museum',
    city: 'Denton, TX',
    address: '1201 W Mulberry St, Denton, TX 76201',
    description:
      'A University of North Texas arts facility. Building access, exhibitions, and room availability depend on university schedules and events.',
    hours: 'Check UNT building and gallery schedules',
    location: { lat: 33.21312, lng: -97.14525 },
    sensory: {
      noise: 'moderate',
      lighting: 'normal',
      crowd: 'moderate',
      temperature: 'Not verified',
      scents: 'Not verified',
    },
    accessibility: {},
  },
  {
    id: 'square-burger-co',
    name: 'LSA Burger Co.',
    category: 'restaurant',
    city: 'Denton, TX',
    address: '113 W Hickory St, Denton, TX 76201',
    description:
      'A restaurant on the Denton Square. Music, food preparation, and customer activity can affect the sensory environment.',
    hours: 'Check current business hours',
    location: { lat: 33.21458342041195, lng: -97.13316561534339 },
    sensory: {
      noise: 'high',
      lighting: 'bright',
      crowd: 'moderate',
      temperature: 'Not verified',
      scents: 'Not verified',
    },
    accessibility: {},
  },
  {
    id: 'calm-corner-books',
    name: 'Recycled Books, Records & CDs',
    category: 'store',
    city: 'Denton, TX',
    address: '200 N Locust St, Denton, TX 76201',
    description:
      'An independent bookstore and music shop in the historic Wright Opera House in downtown Denton.',
    hours: '9 AM–9 PM daily; verify before visiting',
    location: { lat: 33.215960928314374, lng: -97.13228479999998 },
    sensory: {
      noise: 'moderate',
      lighting: 'normal',
      crowd: 'moderate',
      temperature: 'Not verified',
      scents: 'Not verified',
    },
    accessibility: {},
  },
];

export const mockPlaces: LocatedPlace[] = places.map(withReviewStats);
