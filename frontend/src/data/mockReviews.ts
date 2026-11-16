
import type { Review } from '../types/place';

type ReviewSeed = [author: string, rating: number, date: string, text: string];

// Fictional demonstration reviews for the Sensory Scout capstone.
// These are not genuine visitor submissions or verified venue observations.
const seeds: Record<string, ReviewSeed[]> = {
    'denton-public-library': [
        ['Maya R.', 5, '2026-09-28', 'A lovely place to spend a quiet afternoon. The reading areas make it easy to find a comfortable spot.'],
        ['James T.', 4, '2026-09-15', 'Calm overall. The entrance area can get busier later in the day, so an earlier visit may be preferable.'],
        ['Priya S.', 5, '2026-08-30', 'A welcoming library with plenty to explore. We enjoyed spending time reading together.'],
        ['Daniel O.', 5, '2026-08-21', 'A good place to concentrate and get some work done. I especially enjoyed the quieter atmosphere.'],
        ['Rosa M.', 4, '2026-08-09', 'Spacious and comfortable. The indoor temperature felt a little cool during my visit.'],
        ['Kevin L.', 5, '2026-07-30', 'Visited on a Sunday morning and enjoyed a peaceful reading session.'],
        ['Aisha B.', 4, '2026-07-18', 'There can be more activity around the library at certain times, but I enjoyed my visit.'],
        ['Tom H.', 5, '2026-07-02', 'A welcoming public space with a pleasant atmosphere. Easy to spend a few hours here.'],
        ['Grace W.', 5, '2026-06-21', 'A comfortable place to read or study. I appreciated having different areas to choose from.'],
        ['Hector V.', 4, '2026-06-08', 'It was busier during my visit than expected, but I was still able to find a comfortable place.'],
        ['Jenna K.', 5, '2026-05-27', 'A thoughtful and welcoming environment. The library staff made the visit enjoyable.'],
        ['Omar S.', 5, '2026-05-12', 'One of my favourite places to spend a quiet afternoon in Denton.'],
    ],

    'north-lakes-park': [
        ['Carlos M.', 4, '2026-10-02', 'The walking paths and open spaces make for a relaxing morning. Weekends can be busier.'],
        ['Hannah L.', 5, '2026-09-20', 'Lots of open space and greenery. Easy to enjoy a peaceful walk away from busier areas.'],
        ['Devon K.', 4, '2026-09-04', 'I enjoyed walking around the park. The weather and sunlight can make a difference, so plan accordingly.'],
        ['Lily C.', 4, '2026-08-27', 'A pleasant outdoor space. Occasional maintenance activity can be noisy, but otherwise enjoyable.'],
        ['Andre P.', 5, '2026-08-16', 'Evening walks here are lovely. The open surroundings make it a relaxing place to unwind.'],
        ['Megan F.', 4, '2026-08-03', 'Some areas are more active than others. It is worth exploring to find a comfortable spot.'],
        ['Sam Y.', 4, '2026-07-22', 'A nice outdoor escape with plenty of room to walk around and enjoy the surroundings.'],
        ['Nina R.', 4, '2026-07-10', 'Weekday mornings felt especially peaceful. The park was noticeably busier later in the day.'],
        ['Paul E.', 5, '2026-06-28', 'A lovely place for an early morning walk. The quiet surroundings were a highlight.'],
    ],

    'harmony-coffee': [
        ['Alicia P.', 4, '2026-10-05', 'A welcoming coffee shop. The coffee equipment can be noisy at times, so choose your seat carefully.'],
        ['Ben W.', 4, '2026-09-22', 'A nice place to study before the lunchtime rush. The lighting is quite bright.'],
        ['Sofia G.', 4, '2026-09-10', 'Gets busier later in the afternoon, but I enjoyed the atmosphere during my morning visit.'],
        ['Jordan E.', 5, '2026-08-29', 'Friendly atmosphere and a good place to take a break while exploring downtown Denton.'],
        ['Chloe N.', 4, '2026-08-14', 'The coffee grinder can be loud in short bursts. Otherwise, a pleasant place to relax.'],
        ['Marco D.', 4, '2026-08-01', 'Comfortable surroundings and a good selection of drinks. It can feel crowded around lunchtime.'],
        ['Ivy S.', 4, '2026-07-19', 'Bright windows and a lively atmosphere. A nice option if you enjoy busy coffee shops.'],
    ],

    'unt-art-gallery': [
        ['Noah B.', 5, '2026-09-30', 'A pleasant place to explore art and take a break from the busy campus surroundings.'],
        ['Grace H.', 4, '2026-09-12', 'The atmosphere was relaxed during my visit. Special events may bring larger crowds.'],
        ['Leo F.', 5, '2026-08-25', 'A refreshing change of pace. I enjoyed exploring the building at a quieter time.'],
        ['Emma Z.', 4, '2026-08-11', 'Some exhibitions may include audio or video elements, so it is worth checking what is on display.'],
        ['Owen J.', 5, '2026-07-28', 'An interesting place to explore. I appreciated being able to take my time looking around.'],
    ],

    'square-burger-co': [
        ['Tasha N.', 4, '2026-10-06', 'The food was enjoyable, but the restaurant can get noisy during busy periods.'],
        ['Ryan C.', 3, '2026-09-27', 'Friday evening was crowded. A weekday lunch visit might offer a more relaxed experience.'],
        ['Emily D.', 4, '2026-09-14', 'The lighting was bright and there were noticeable cooking smells. The staff were friendly.'],
        ['Victor S.', 5, '2026-09-01', 'Visited during a quieter afternoon and had a pleasant meal.'],
        ['Paige W.', 4, '2026-08-18', 'Music and conversations can make the dining area lively. I enjoyed the food and service.'],
        ['Hugo R.', 4, '2026-08-05', 'The restaurant felt warm during my visit. A good option for a casual meal.'],
        ['Jade M.', 3, '2026-07-24', 'There was a long line and plenty of activity during lunchtime. Going earlier may help.'],
        ['Isaac P.', 5, '2026-07-11', 'Friendly service and an enjoyable meal. Calling ahead may help when planning a visit.'],
        ['Kara L.', 4, '2026-06-30', 'The restaurant was lively, but the food arrived quickly. A pleasant downtown dining option.'],
        ['Derek M.', 2, '2026-06-17', 'It was very busy and noisy during my visit. The atmosphere may not suit everyone.'],
        ['Fiona C.', 4, '2026-06-02', 'Weekday afternoons felt calmer than evenings. The staff were kind and helpful.'],
    ],

    'calm-corner-books': [
        ['Olivia J.', 5, '2026-10-01', 'A lovely independent bookstore. I enjoyed browsing at my own pace.'],
        ['Marcus A.', 5, '2026-09-18', 'A pleasant shop with an interesting selection of books and music.'],
        ['Zoe V.', 4, '2026-09-03', 'Lovely shop in downtown Denton. It is worth checking the entrance and layout if step-free access is important.'],
        ['Felix W.', 5, '2026-08-22', 'A charming place to explore. I enjoyed the relaxed atmosphere and browsing the shelves.'],
        ['Ava L.', 4, '2026-08-08', 'Some aisles can feel narrow when there are several visitors inside.'],
        ['Caleb T.', 5, '2026-07-26', 'A great place to discover books, records and other interesting finds.'],
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
