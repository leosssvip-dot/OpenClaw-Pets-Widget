import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { SshConnectionForm, type SshConnectionInput } from './SshConnectionForm';

export function GatewayProfiles({
  profiles,
  activeProfileId,
  onConnect
}: {
  profiles: GatewayProfile[];
  activeProfileId: string | null;
  onConnect: (input: SshConnectionInput) => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="gateway-profiles">
      <div className="section-heading">
        <h2>Gateways</h2>
        <button type="button" onClick={() => setIsOpen((value) => !value)}>
          Connect Remote
        </button>
      </div>

      {isOpen ? (
        <SshConnectionForm
          onSubmit={async (input) => {
            await onConnect(input);
            setIsOpen(false);
          }}
        />
      ) : null}

      <ul className="gateway-profiles__list">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className={profile.id === activeProfileId ? 'gateway-profiles__item gateway-profiles__item--active' : 'gateway-profiles__item'}
          >
            <strong>{profile.label}</strong>
            <span>
              {profile.transport === 'ssh'
                ? `${profile.username}@${profile.host}:${profile.sshPort}`
                : profile.transport === 'tailnet'
                  ? profile.baseUrl
                  : profile.transport}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
