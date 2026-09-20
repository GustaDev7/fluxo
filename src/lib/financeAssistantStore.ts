import type { FinanceAssistantMessage, FinanceAssistantMessageMetadata, FinanceAssistantRole } from '../types/assistant';
import { supabase } from './supabase';

type AssistantMessageRow = {
  id: string;
  role: FinanceAssistantRole;
  content: string;
  metadata: FinanceAssistantMessageMetadata | null;
  created_at: string;
};

const fromRow = (row: AssistantMessageRow): FinanceAssistantMessage => ({
  id: row.id,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
  metadata: row.metadata || undefined,
});

export async function loadFinanceAssistantMessages(userId: string): Promise<FinanceAssistantMessage[]> {
  const { data, error } = await supabase
    .from('finance_assistant_messages')
    .select('id, role, content, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) throw error;
  return ((data || []) as AssistantMessageRow[]).reverse().map(fromRow);
}

export async function saveFinanceAssistantMessage(userId: string, message: FinanceAssistantMessage): Promise<void> {
  const { error } = await supabase.from('finance_assistant_messages').insert({
    id: message.id,
    user_id: userId,
    role: message.role,
    content: message.content,
    metadata: message.metadata || {},
    created_at: message.createdAt,
  });

  if (error) throw error;
}

export async function updateFinanceAssistantMessageMetadata(
  userId: string,
  messageId: string,
  metadata: FinanceAssistantMessageMetadata,
): Promise<void> {
  const { error } = await supabase
    .from('finance_assistant_messages')
    .update({ metadata })
    .eq('user_id', userId)
    .eq('id', messageId);

  if (error) throw error;
}

export async function clearFinanceAssistantMessages(userId: string): Promise<void> {
  const { error } = await supabase
    .from('finance_assistant_messages')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
