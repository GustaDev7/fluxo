import { supabase } from './supabase';

export interface Workspace {
  id: string;
  kind: 'personal' | 'couple';
  memberCount: number;
  archived: boolean;
  inviteEmail: string | null;
}

export function workspaceLabel(workspace: Workspace) {
  return workspace.kind === 'couple' ? 'Nosso espaço' : 'Meu espaço';
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase.rpc('fluxo_list_workspaces');
  if (error) throw error;
  return data;
}

export async function invitePartner(email: string) {
  const { data, error } = await supabase.rpc('fluxo_invite_partner', { partner_email: email });
  if (error) throw error;
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set('convite', data);
  return url.toString();
}

export async function acceptInvite(token: string) {
  const { data, error } = await supabase.rpc('fluxo_accept_invite', { invitation_token: token });
  if (error) throw error;
  const url = new URL(window.location.href);
  url.searchParams.delete('convite');
  window.history.replaceState(null, '', url);
  return data as string;
}

export async function leaveCouple(workspaceId: string) {
  const { error } = await supabase.rpc('fluxo_leave_couple', { target_workspace: workspaceId });
  if (error) throw error;
}

export function inviteRedirect() {
  const url = new URL(window.location.pathname, window.location.origin);
  const invite = new URLSearchParams(window.location.search).get('convite');
  if (invite) url.searchParams.set('convite', invite);
  return url.toString();
}

export function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}
