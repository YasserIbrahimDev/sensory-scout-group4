import type { Review } from '../types/place';

type ReviewSeed = [author: string, rating: number, date: string, text: string];

// Sample reviews only. Replace with API data in "UI: Connect Sprint 1 pages to the API".
// Each place's rating and review count in mockPlaces.ts are worked out from these.
const seeds: Record<string, ReviewSeed[]> = {
  'denton-public-library': [
    ['Maya R.', 5, '2026-09-28', 'The second-floor quiet room is perfect. Soft lighting and almost no noise on weekday afternoons.'],
    ['James T.', 4, '2026-09-15', 'Calm overall. The kids area near the entrance gets loud around 4 PM, so head upstairs.'],
    ['Priya S.', 5, '2026-08-30', 'Staff told us about the sensory room before we asked. My son stayed for two hours.'],
    ['Daniel O.', 5, '2026-08-21', 'Individual study carrels with lamps you can turn off. Great if overhead lights bother you.'],
    ['Rosa M.', 4, '2026-08-09', 'Quiet and spacious. The air conditioning is a little cold, so bring a sweater.'],
    ['Kevin L.', 5, '2026-07-30', 'Visited on a Sunday morning and had a whole reading room to myself.'],
    ['Aisha B.', 4, '2026-07-18', 'Story time on Wednesdays is noisy, but the rest of the building stays calm.'],
    ['Tom H.', 5, '2026-07-02', 'Clear signs, step-free entrance, and staff who speak softly. Very welcoming.'],
    ['Grace W.', 5, '2026-06-21', 'Booked a small study room online. Quiet, private, and the lights have a dimmer.'],
    ['Hector V.', 4, '2026-06-08', 'Busy during summer reading events, but the third floor stayed calm.'],
    ['Jenna K.', 5, '2026-05-27', 'The staff lent my daughter noise-reducing earmuffs. Such a thoughtful touch.'],
    ['Omar S.', 5, '2026-05-12', 'Best quiet spot in Denton. Comfortable chairs and natural light by the windows.'],
  ],
  'north-lakes-park': [
    ['Carlos M.', 4, '2026-10-02', 'The trail by the pond is peaceful in the morning. Avoid Saturday soccer games if crowds bother you.'],
    ['Hannah L.', 5, '2026-09-20', 'Lots of shade and open space. Easy to find a quiet bench away from the playground.'],
    ['Devon K.', 4, '2026-09-04', 'Wide paved paths worked well with a wheelchair. Bring sunglasses at midday.'],
    ['Lily C.', 4, '2026-08-27', 'Lawn mowers run on Monday mornings, which was loud. Other days are lovely.'],
    ['Andre P.', 5, '2026-08-16', 'Sunset walks here are calm and the lighting is gentle. Our favorite spot.'],
    ['Megan F.', 4, '2026-08-03', 'Restrooms are near the busy fields, so plan ahead if you want to avoid crowds.'],
    ['Sam Y.', 4, '2026-07-22', 'Nice breeze by the water. Geese can be noisy but the trail is wide.'],
    ['Nina R.', 4, '2026-07-10', 'Weekday mornings are nearly empty. Weekends get busy after 10 AM.'],
    ['Paul E.', 5, '2026-06-28', 'The far loop trail is almost silent at dawn. Great for a calm walk.'],
  ],
  'harmony-coffee': [
    ['Alicia P.', 4, '2026-10-05', 'Cozy and friendly. The espresso machine is loud at times, so sit by the window.'],
    ['Ben W.', 4, '2026-09-22', 'Great for studying before noon. Lights are bright and the coffee smell is strong.'],
    ['Sofia G.', 4, '2026-09-10', 'Gets busy after 3 PM with students, but mornings are calm.'],
    ['Jordan E.', 5, '2026-08-29', 'Staff turned the music down when I asked. Really appreciated that.'],
    ['Chloe N.', 4, '2026-08-14', 'The back corner is the quietest seat. Grinder noise comes in short bursts.'],
    ['Marco D.', 4, '2026-08-01', 'Comfortable temperature and plenty of outlets. Can feel crowded at lunch.'],
    ['Ivy S.', 4, '2026-07-19', 'Bright big windows. Great if you like light, less so if it bothers you.'],
  ],
  'unt-art-gallery': [
    ['Noah B.', 5, '2026-09-30', 'Very quiet with gentle lighting. Benches in every room make it easy to take breaks.'],
    ['Grace H.', 4, '2026-09-12', 'Small and calm. Opening nights are crowded, so check the events calendar first.'],
    ['Leo F.', 5, '2026-08-25', 'Cool temperature and almost empty on weekday mornings. A nice reset.'],
    ['Emma Z.', 4, '2026-08-11', 'One room has a video piece with sound, but you can skip it easily.'],
    ['Owen J.', 5, '2026-07-28', 'Soft spotlights, no crowds, and the staff were happy to answer questions quietly.'],
  ],
  'square-burger-co': [
    ['Tasha N.', 4, '2026-10-06', 'Food is great but it is loud inside with music and the kitchen. The patio is much quieter.'],
    ['Ryan C.', 3, '2026-09-27', 'Too crowded on Friday night for us. Lunch on a weekday was better.'],
    ['Emily D.', 4, '2026-09-14', 'Bright lights and strong cooking smells. Staff were happy to seat us in a corner.'],
    ['Victor S.', 5, '2026-09-01', 'Went at 2 PM on a Tuesday and it was calm. Friendly staff.'],
    ['Paige W.', 4, '2026-08-18', 'Music is loud but they have a quieter booth area in the back.'],
    ['Hugo R.', 4, '2026-08-05', 'Warm inside near the grill. Patio fans help a lot.'],
    ['Jade M.', 3, '2026-07-24', 'Long lines and lots of noise during the lunch rush. Go early.'],
    ['Isaac P.', 5, '2026-07-11', 'Called ahead and they saved us a quiet table. Great service.'],
    ['Kara L.', 4, '2026-06-30', 'Loud inside but the food came fast. We ate on the patio and it was fine.'],
    ['Derek M.', 2, '2026-06-17', 'Music was very loud and it was packed. Not a good fit for my son.'],
    ['Fiona C.', 4, '2026-06-02', 'Weekday afternoons are much calmer than evenings. Kind staff.'],
  ],
  'calm-corner-books': [
    ['Olivia J.', 5, '2026-10-01', 'Tuesday quiet hour is wonderful. Dim corners and comfy chairs in the back.'],
    ['Marcus A.', 5, '2026-09-18', 'Small and calm, and the sensory room has noise-canceling headphones to borrow.'],
    ['Zoe V.', 4, '2026-09-03', 'Lovely shop. There is one step at the entrance, so it is not wheelchair accessible.'],
    ['Felix W.', 5, '2026-08-22', 'Soft music, warm lighting, and nobody rushes you. A gem.'],
    ['Ava L.', 4, '2026-08-08', 'Aisles are narrow, so it can feel tight when more than a few people are inside.'],
    ['Caleb T.', 5, '2026-07-26', 'The owner set up a reading nook just for kids who need a break.'],
  ],
};

export const mockReviews: Review[] = Object.entries(seeds).flatMap(([placeId, list]) =>
  list.map(([author, rating, date, text], index) => ({
    id: `${placeId}-${index + 1}`,
    placeId,
    author,
    rating,
    date,
    text,
  })),
);
