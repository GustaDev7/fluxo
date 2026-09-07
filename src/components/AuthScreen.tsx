import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FluxoLogo } from './FluxoLogo';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        const needsConfirmation = await signUp(name.trim(), email.trim(), password);
        if (needsConfirmation) {
          setMessage('Cadastro realizado. Confirme seu e-mail para entrar no Fluxo.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recover = async () => {
    if (!email.trim()) {
      setError('Informe seu e-mail para recuperar a senha.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await resetPassword(email.trim());
      setMessage('Enviamos um link de recuperação para o seu e-mail.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-neutral-950 px-5 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-900 shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-700 to-neutral-950 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-28 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <FluxoLogo />
          <div className="relative max-w-lg">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Seus dados protegidos por usuário
            </div>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight">
              Sua vida organizada em um só lugar.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-indigo-100/80">
              Planeje, acompanhe e execute o que importa com clareza.
            </p>
          </div>
          <p className="relative text-xs text-indigo-200/60">Fluxo · Sistema Operacional Pessoal</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden"><FluxoLogo /></div>
            <h2 className="text-2xl font-black tracking-tight">
              {mode === 'signin' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              {mode === 'signin' ? 'Entre para acessar sua central pessoal.' : 'Comece agora a organizar sua vida no Fluxo.'}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-neutral-300">Nome</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" placeholder="Como devemos chamar você?" />
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-neutral-300">E-mail</span>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-base outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" placeholder="voce@email.com" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-neutral-300">Senha</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  <input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-base outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" placeholder="Mínimo de 8 caracteres" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 rounded-lg p-1 text-neutral-500 hover:text-white" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}
              {message && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">{message}</p>}

              <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {mode === 'signin' ? 'Entrar no Fluxo' : 'Criar minha conta'}
              </button>
            </form>

            {mode === 'signin' && (
              <button type="button" onClick={recover} disabled={isSubmitting} className="mt-4 w-full text-center text-sm font-medium text-neutral-400 hover:text-white">
                Esqueci minha senha
              </button>
            )}
            <p className="mt-8 text-center text-sm text-neutral-400">
              {mode === 'signin' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
              <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }} className="font-bold text-indigo-400 hover:text-indigo-300">
                {mode === 'signin' ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
