interface ComingSoonPageProps {
  title: string;
}

export default function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="page">
      <h1 className="page__title">{title}</h1>
      <p className="page__subtitle">This page is coming in a later update.</p>
    </div>
  );
}
