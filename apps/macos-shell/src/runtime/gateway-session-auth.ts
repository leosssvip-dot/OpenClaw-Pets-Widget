export interface GatewaySessionAuth {
  password?: string;
}

const authByProfileId = new Map<string, GatewaySessionAuth>();

export function setGatewaySessionAuth(profileId: string, auth: GatewaySessionAuth) {
  if (!auth.password) {
    authByProfileId.delete(profileId);
    return;
  }

  authByProfileId.set(profileId, auth);
}

export function getGatewaySessionAuth(profileId: string) {
  return authByProfileId.get(profileId);
}

export function clearGatewaySessionAuth(profileId: string) {
  authByProfileId.delete(profileId);
}
