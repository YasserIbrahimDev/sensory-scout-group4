import type { Place } from '../../types/place';

export default function PhotosTab({ place }: { place: Place }) {
  const photos = place.photos ?? [];

  if (photos.length === 0) {
    return <p className="status-message">No photos yet.</p>;
  }

  return (
    <ul className="photo-grid">
      {photos.map((photo) => (
        <li key={photo.url} className="photo-grid__item">
          <figure>
            <img src={photo.url} alt={photo.alt} className="photo-grid__image" loading="lazy" />
            <figcaption className="photo-grid__caption">{photo.alt}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
