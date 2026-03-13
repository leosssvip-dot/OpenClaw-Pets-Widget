import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import {
  SshConnectionForm,
  type SshConnectionDraft,
  type SshConnectionInput
} from './SshConnectionForm';

function isSshProfile(profile: GatewayProfile): profile is Extract<GatewayProfile, { transport: 'ssh' }> {
  return profile.transport === 'ssh';
}

function toDraft(profile: Extract<GatewayProfile, { transport: 'ssh' }>): SshConnectionDraft {
  return {
    host: profile.host,
    username: profile.username,
    sshPort: profile.sshPort,
    identityFile: profile.identityFile,
    remoteGatewayPort: profile.remoteGatewayPort,
    gatewayToken: profile.gatewayToken
  };
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
    input: SshConnectionInput,
    profileId?: string
  ) => Promise<void> | void;
  onDeleteProfile: (profileId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<
    Extract<GatewayProfile, { transport: 'ssh' }> | null
  >(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <section className="gateway-profiles">
      <div className="section-heading">
        <div className="section-heading__copy">
          <h2>Connection & Gateways</h2>
          <p>Saved links and SSH setup for this companion.</p>
        </div>
        <button
          type="button"
          disabled={isConnecting}
          className="settings-btn settings-btn--primary"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setEditingProfile(null);
              return;
            }

            setEditingProfile(null);
            setIsOpen(true);
          }}
        >
          {isConnecting ? 'Connecting...' : isOpen ? 'Cancel' : 'Add gateway'}
        </button>
      </div>

      {isOpen ? (
        <SshConnectionForm
          key={editingProfile?.id ?? 'new-profile'}
          initialValues={editingProfile ? toDraft(editingProfile) : undefined}
          submitLabel={editingProfile ? 'Save' : 'Connect'}
          disabled={isConnecting}
          onSubmit={async (input) => {
            await onSaveProfile(input, editingProfile?.id);
            setEditingProfile(null);
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
            <span className="gateway-profiles__meta">
              {profile.transport === 'ssh'
                ? `${profile.username}@${profile.host}:${profile.sshPort}`
                : profile.transport === 'tailnet'
                  ? profile.baseUrl
                  : profile.transport}
            </span>
            <div className="gateway-profiles__actions">
              {isSshProfile(profile) ? (
                <button
                  type="button"
                  className="gateway-profiles__action"
                  disabled={isConnecting}
                  onClick={() => {
                    setEditingProfile(profile);
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
                        setEditingProfile(null);
                        setIsOpen(false);
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
