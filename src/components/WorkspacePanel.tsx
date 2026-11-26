import { useState, type FormEvent } from 'react';
import { Copy, HeartHandshake, UserRound, X } from 'lucide-react';
import { acceptInvite, errorMessage, invitePartner, leaveCouple, workspaceLabel, type Workspace } from '../lib/workspaces';

const actionClass = 'min-h-10 rounded-xl bg-indigo-600 px-3.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50';

export function WorkspacePanel({ current, workspaces, invitation, onClose, onChange, onRefresh, flush }: {
  current: Workspace;
  workspaces: Workspace[];
  invitation: string | null;
  onClose: () => void;
  onChange: (id: string) => void;
  onRefresh: (active?: string) => Promise<void>;
  flush: () => Promise<boolean>;
}) {
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [problem, setProblem] = useState('');
  const personal = workspaces.find(workspace => workspace.kind === 'personal')!;
  const couple = workspaces.find(workspace => workspace.kind === 'couple');

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setProblem('');
    setStatus('');
    try { await action(); }
    catch (error) { setProblem(errorMessage(error, 'Não foi possível atualizar o espaço.')); }
    finally { setBusy(false); }
  }

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      setLink(await invitePartner(email));
      await onRefresh();
      setStatus('Convite criado. O link vale por 48 horas.');
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/70 p-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="workspace-title" onClick={event => event.stopPropagation()} className="w-full max-w-lg rounded-3xl border border-violet-950 bg-[#151021] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <HeartHandshake className="mb-3 size-6 text-violet-400" />
            <h2 id="workspace-title" className="text-xl font-black">Seus espaços</h2>
            <p className="mt-1 text-sm text-neutral-400">Organize suas finanças pessoais e planeje em casal.</p>
          </div>
          <button className="rounded-xl p-2 text-neutral-300 hover:bg-white/10" onClick={onClose} aria-label="Fechar espaços"><X className="size-5" /></button>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {workspaces.map(workspace => (
            <button key={workspace.id} type="button" aria-pressed={workspace.id === current.id} disabled={busy} onClick={() => void run(async () => {
              if (workspace.id !== current.id && !await flush()) throw new Error('Sincronize suas alterações antes de trocar de espaço.');
              onChange(workspace.id);
              onClose();
            })} className="flex items-center gap-2 rounded-xl border border-violet-900 px-3 py-3 text-left text-sm font-bold hover:border-violet-500 aria-pressed:border-violet-400 aria-pressed:bg-violet-500/15">
              {workspace.kind === 'personal' ? <UserRound className="size-4 text-violet-300" /> : <HeartHandshake className="size-4 text-violet-300" />}
              {workspaceLabel(workspace)}
            </button>
          ))}
        </div>

        {invitation && !couple && (
          <div className="mt-5 rounded-2xl bg-violet-500/10 p-4">
            <h3 className="text-sm font-bold">Você recebeu um convite</h3>
            <p className="mt-1 text-sm text-neutral-400">Entre com o e-mail que recebeu o link para participar do espaço do casal.</p>
            <button className={actionClass + ' mt-3'} disabled={busy} onClick={() => void run(async () => {
              if (!await flush()) throw new Error('Sincronize suas alterações antes de aceitar.');
              const id = await acceptInvite(invitation);
              await onRefresh(id);
              onClose();
            })}>Aceitar convite</button>
          </div>
        )}
        {!invitation && (!couple || (couple.memberCount < 2 && !couple.archived)) && (
          <form onSubmit={handleInvite} className="mt-5 grid gap-2">
            <label htmlFor="partner-email" className="text-sm font-bold">E-mail da outra pessoa</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input id="partner-email" type="email" className="field-input min-w-0 flex-1" required value={email} onChange={event => setEmail(event.target.value)} />
              <button className={actionClass} disabled={busy}>{couple?.inviteEmail ? 'Gerar novo link' : 'Criar convite'}</button>
            </div>
            {link && <div className="flex gap-2">
              <input aria-label="Link do convite" className="field-input min-w-0 flex-1" value={link} readOnly onFocus={event => event.target.select()} />
              <button aria-label="Copiar link" type="button" className={actionClass} onClick={() => void run(async () => { await navigator.clipboard.writeText(link); setStatus('Link copiado.'); })}><Copy className="size-4" /></button>
            </div>}
          </form>
        )}
        {couple && <div className="mt-5 flex items-center justify-between gap-3 border-t border-violet-950 pt-4 text-sm">
          <span className="text-neutral-400">{couple.archived ? 'Espaço encerrado. Exporte o histórico antes de sair.' : couple.memberCount === 2 ? '2 pessoas no espaço do casal' : '1 pessoa no espaço do casal'}</span>
          <button className="rounded-lg px-2 py-2 font-semibold text-rose-300 hover:bg-rose-500/10" disabled={busy} onClick={() => {
            if (!window.confirm('Sair do espaço do casal e interromper o compartilhamento das suas conexões?')) return;
            void run(async () => {
              if (!await flush()) throw new Error('Sincronize suas alterações antes de sair.');
              await leaveCouple(couple.id);
              await onRefresh(personal.id);
              onClose();
            });
          }}>Sair do casal</button>
        </div>}
        {status && <p role="status" className="mt-3 text-sm text-emerald-300">{status}</p>}
        {problem && <p role="alert" className="mt-3 text-sm text-rose-300">{problem}</p>}
      </section>
    </div>
  );
}
