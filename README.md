# Fluxo

O Fluxo organiza as finanças pessoais e do casal. Cada pessoa usa a própria conta. Em **Meu espaço**, gerencia seus lançamentos e extratos privados. Em **Nosso espaço**, o casal trabalha no mesmo orçamento, nas mesmas metas e nos mesmos compromissos.

## Rodar o app

1. Use Node.js 22 ou mais recente. Rode `npm ci` e copie `.env.example` para `.env.local`.
2. Se usar outro projeto Supabase, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave publicável desse projeto.
3. Rode `npm run dev`. Para hospedar o frontend, rode `npm run build` e publique `dist/` como um app Vite.
4. Configure a URL do site e as URLs permitidas de redirecionamento em **Authentication → URL Configuration**. Permita o endereço do frontend usado no cadastro e na confirmação do convite. Configure um SMTP próprio para cadastrar pessoas de fora da equipe do Supabase e mantenha a confirmação de e-mail ativada.

O projeto hospedado é [fluxo-casal](https://supabase.com/dashboard/project/kwhbkkvoahxztzzscdnm). O banco é novo. Contas de autenticação e dados do projeto anterior precisam de uma migração de dados planejada, se forem necessários.

## Finanças do casal sem provedor pago

1. Abra **Meu espaço → Criar convite** e compartilhe o link com a outra pessoa. O convite vale por 48 horas e exige o e-mail confirmado indicado na criação.
2. Em **Bancos e extratos**, cada pessoa importa seu próprio OFX. Informe o mesmo nome da instituição nas importações seguintes da mesma origem para manter a deduplicação.
3. Use **Compartilhar com o casal** nas origens que devem aparecer em **Nosso espaço**. É possível tornar uma origem privada a qualquer momento. Ao sair do casal, seu compartilhamento é desativado.

A importação registra os lançamentos do extrato e o saldo que o arquivo informa, quando disponível. Despesas do extrato ficam na aba de bancos. Adicione ao orçamento manual somente lançamentos que devem compor o planejamento do casal.

## Open Finance em sandbox

O modo padrão da função `open-finance` é `sandbox`. A função aceita apenas conectores de teste nesse modo. Ela usa credenciais de uma aplicação Pluggy cadastradas em **Edge Functions → Secrets** com os nomes `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`. Use `FLUXO_APP_ORIGIN` para limitar as chamadas do navegador ao endereço de hospedagem.

Use `supabase functions deploy open-finance --project-ref kwhbkkvoahxztzzscdnm --use-api` após autenticar o Supabase CLI. A função valida o JWT de sessão pelo Supabase Auth e verifica o titular antes de registrar, atualizar, reautorizar ou desconectar uma instituição. O CPF, a senha do banco e os tokens do provedor ficam fora do banco do Fluxo. A atualização do extrato é iniciada na interface e consulta os dados disponíveis no provedor.

O sandbox tem dados sintéticos. A opção Meu Pluggy gratuita é documentada para leitura dos próprios dados. Bancos reais dentro do produto dependem de um provedor e de condições comerciais compatíveis com dois titulares.

## Banco e verificações

- As migrações recriam o esquema do zero. Para um projeto novo, use `supabase link --project-ref <ref>` e `supabase db push`. Em desenvolvimento com Supabase local, use `supabase db reset`.
- O banco valida a associação ao espaço em cada requisição. Orçamentos, metas e lançamentos manuais são gravados juntos, com controle de versão para detectar alterações de outra sessão. Contas e lançamentos bancários usam tabelas próprias com compartilhamento explícito.
- Rode `npm run lint`, `npm test` e `npm run build`. Execute `supabase/tests/workspaces.sql` com o papel `postgres` no SQL Editor ou no `psql`. O script reverte os dados de teste.
