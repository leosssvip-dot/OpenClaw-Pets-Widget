import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import {
  SshConnectionForm,
  LocalConnectionForm,
  type SshConnectionDraft,
  type ConnectionInput
} from './SshConnectionForm';

type TransportMode = 'ssh' | 'local';

function isSshProfile(profile: GatewayProfile): profile is Extract<GatewayProfile, { transport: 'ssh' }> {
  return profile.transport === 'ssh';
}

function isLocalProfile(profile: GatewayProfile): profile is Extract<GatewayProfile, { transport: 'local' }> {
  return profile.transport === 'local';
}

function toSshDraft(profile: Extract<GatewayProfile, { transport: 'ssh' }>): SshConnectionDraft {
  return {
    host: profile.host,
    username: profile.username,
    sshPort: profile.sshPort,
    remoteGatewayPort: profile.remoteGatewayPort,
    gatewayToken: profile.gatewayToken
  };
}

function profileMeta(profile: GatewayProfile) {
  switch (profile.transport) {
    case 'ssh':
      return `${profile.username}@${profile.host}:${profile.sshPort}`;
    case 'local':
      return `localhost:${profile.gatewayPort ?? 18789}`;
    case 'tailnet':
      return profile.baseUrl;
  }
}

export function GatewayProfiles({
  profiles,
  activeProfileId,
  isConnecting,
  onSaveProfile,
  onDeleteProfile
}: {
  profiles: GatewayProfile[];
  activeProfileId: string | null;
  isConnecting?: boolean;
  onSaveProfile: (
    input: ConnectionInput,
    profileId?: string
  ) => Promise<void> | void;
  onDeleteProfile: (profileId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('ssh');
  const [editingProfile, setEditingProfile] = useState<GatewayProfile | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const openNewForm = (mode: TransportMode) => {
    setEditingProfile(null);
    setTransportMode(mode);
    setIsOpen(true);
  };

  const closeForm = () => {
    setIsOpen(false);
    setEditingProfile(null);
  };

  return (
    <section className="gateway-profiles">
      <div className="section-heading">
        <div className="section-heading__copy">
          <h2>Connection & Gateways</h2>
          <p>Saved links and gateway setup for this companion.</p>
        </div>
        <button
          type="button"
          disabled={isConnecting}
          className="settings-btn settings-btn--primary"
          onClick={() => {
            if (isOpen) {
              closeForm();
              return;
            }
            openNewForm('ssh');
          }}
        >
          {isConnecting ? 'Connecting...' : isOpen ? 'Cancel' : 'Add gateway'}
        </button>
      </div>

      {isOpen && (
        <>
          {!editingProfile && (
            <div className="gateway-profiles__transport-tabs">
              <button
                type="button"
                className={`gateway-profiles__transport-tab ${transportMode === 'ssh' ? 'gateway-profiles__transport-tab--active' : ''}`}
                onClick={() => setTransportMode('ssh')}
              >
                SSH Tunnel
              </button>
              <button
                type="button"
                className={`gateway-profiles__transport-tab ${transportMode === 'local' ? 'gateway-profiles__transport-tab--active' : ''}`}
                onClick={() => setTransportMode('local')}
              >
                Local
              </button>
            </div>
          )}

          {transportMode === 'ssh' ? (
            <SshConnectionForm
              key={editingProfile?.id ?? 'new-ssh'}
              initialValues={editingProfile && isSshProfile(editingProfile) ? toSshDraft(editingProfile) : undefined}
              submitLabel={editingProfile ? 'Save' : 'Connect'}
              disabled={isConnecting}
              onSubmit={async (input) => {
                await onSaveProfile({ transport: 'ssh', ...input }, editingProfile?.id);
                closeForm();
              }}
            />
          ) : (
            <LocalConnectionForm
              key={editingProfile?.id ?? 'new-local'}
              initialValues={editingProfile && isLocalProfile(editingProfile) ? undefined : undefined}
              submitLabel={editingProfile ? 'Save' : 'Connect'}
              disabled={isConnecting}
              onSubmit={async (input) => {
                await onSaveProfile({ transport: 'local', ...input }, editingProfile?.id);
                closeForm();
              }}
            />
          )}
        </>
      )}

      <ul className="gateway-profiles__list">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className={profile.id === activeProfileId ? 'gateway-profiles__item gateway-profiles__item--active' : 'gateway-profiles__item'}
          >
            <strong>{profile.label}</strong>
            <span className="gateway-profiles__meta">
              {profileMeta(profile)}
            </span>
            <div className="gateway-profiles__actions">
              {isSshProfile(profile) ? (
                <button
                  type="button"
                  className="gateway-profiles__action"
                  disabled={isConnecting}
                  onClick={() => {
                    setEditingProfile(profile);
                    setTransportMode('ssh');
                    setIsOpen(true);
                  }}
                >
                  Edit
                </button>
              ) : null}
              {pendingDeleteId === profile.id ? (
                <>
                  <button
                    type="button"
                    className="gateway-profiles__action gateway-profiles__action--danger"
                    onClick={() => {
                      onDeleteProfile(profile.id);
                      setPendingDeleteId(null);
                      if (editingProfile?.id === profile.id) {
                        closeForm();
                      }
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="gateway-profiles__action"
                    onClick={() => setPendingDeleteId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="gateway-profiles__action gateway-profiles__action--danger"
                  disabled={isConnecting}
                  onClick={() => setPendingDeleteId(profile.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
