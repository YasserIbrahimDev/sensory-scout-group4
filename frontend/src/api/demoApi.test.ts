import { fetchDemoPreferences, fetchDemoRecommendations, saveDemoPreferences } from './demoApi';

const preferences = { noise: 1 as const, lighting: 3 as const, crowd: null };
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('development demo API client', () => {
  it("loads the configured demo user's persisted preferences", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ demo_user: 'Sensory Scout Development Demo', preferences }));
    const response = await fetchDemoPreferences(fetcher);
    expect(response.preferences).toEqual(preferences);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/demo/preferences'),
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    );
  });

  it('saves the complete numeric preference profile', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ demo_user: 'Demo', preferences }));
    await expect(saveDemoPreferences(preferences, fetcher)).resolves.toEqual(preferences);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/demo/preferences'), expect.objectContaining({ method: 'PUT', body: JSON.stringify(preferences) }));
  });

  it('loads recommendations and adapts venue data for existing place cards', async () => {
    const venue = {
      id: 12, name: 'Quiet Library', category: 'library', address: '1 Main St', city: 'Denton', image_url: null,
      is_sample: true, slug: 'quiet-library', description: 'A library', latitude: null, longitude: null,
      external_map_provider: null, external_map_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      review_count: 2, sensory_summary: { ratings_count: 2, noise_rating: 1, light_rating: 3, crowd_rating: null, noise_count: 2, light_count: 2, crowd_count: 0 },
      accessibility_summary: { accessible_reports: 0, inaccessible_reports: 0, unknown_reports: 2 },
    };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ demo_user: 'Demo', items: [{ venue, score: 95, reason: 'Matches your noise preference' }] }));
    const result = await fetchDemoRecommendations(3, fetcher);
    expect(result[0]).toMatchObject({ place: { id: '12', name: 'Quiet Library', category: 'library', sensory: { noise: 'low', lighting: 'normal' } }, score: 95, reason: 'Matches your noise preference' });
  });

  it('provides a useful error when demo mode is disabled on the backend', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ detail: 'Not found' }, 404));
    await expect(fetchDemoPreferences(fetcher)).rejects.toThrow(/demo mode is enabled/i);
  });
});
