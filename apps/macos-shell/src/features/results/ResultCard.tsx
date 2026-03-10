export function ResultCard({
  title,
  body,
  status
}: {
  title: string;
  body: string;
  status: string;
}) {
  return (
    <article className="result-card">
      <header className="result-card__header">
        <strong>{title}</strong>
        <span>{status}</span>
      </header>
      <p>{body}</p>
    </article>
  );
}
