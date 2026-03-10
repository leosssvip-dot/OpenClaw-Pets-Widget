import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';

export function GatewayProfiles({
  profiles,
  activeProfileId,
  onConnect
}: {
  profiles: GatewayProfile[];
  activeProfileId: string | null;
  onConnect: (input: { label: string; baseUrl: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:4318');

  return (
    <section className="gateway-profiles">
      <div className="section-heading">
        <h2>Gateways</h2>
        <button type="button" onClick={() => setIsOpen((value) => !value)}>
          Add Gateway
        </button>
      </div>

      {isOpen ? (
        <form
          className="gateway-profiles__form"
          onSubmit={(event) => {
            event.preventDefault();
            onConnect({
              label: 'Remote Gateway',
              baseUrl
            });
            setIsOpen(false);
          }}
        >
          <label>
            Gateway URL
            <input
              aria-label="Gateway URL"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </label>
          <button type="submit">Connect</button>
        </form>
      ) : null}

      <ul className="gateway-profiles__list">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className={profile.id === activeProfileId ? 'gateway-profiles__item gateway-profiles__item--active' : 'gateway-profiles__item'}
          >
            <strong>{profile.label}</strong>
            <span>{profile.transport === 'tailnet' ? profile.baseUrl : profile.transport}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
