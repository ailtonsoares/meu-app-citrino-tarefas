import { useState } from 'react';
import { Database, GitFork, AlertOctagon, HelpCircle, Eye, Compass, Copy, Check } from 'lucide-react';

export default function PlanningDocument() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'ux' | 'sprints' | 'bottlenecks'>('architecture');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const schemaCode = `{
  "Task": {
    "id": "uuid-v4_string",
    "user_id": "uuid-v4_string",
    "title": "varchar(255)",
    "description": "text_nullable",
    "completed": "boolean_default_false",
    "due_date": "date_nullable (YYYY-MM-DD)",
    "due_time": "time_nullable (HH:MM)",
    "priority": "varchar(10) Check(low, medium, high)",
    "category": "varchar(50) _default('Outros')",
    "created_at": "timestamp_with_timezone",
    "updated_at": "timestamp_with_timezone",
    "pomodoro_count": "integer_default_0",
    "pomodoros_target": "integer_default_1",
    
    // CAMPOS DE SINCRONIZAÇÃO OFFLINE DE ALTA INTEGRIDADE
    "is_synced": "boolean_default_false",
    "last_edited_by_device": "unique_device_id_string",
    "is_deleted_locally": "boolean_default_false" // Soft delete para sincronizar deleções
  },
  
  "User": {
    "id": "uuid-v4_string",
    "email": "varchar(255)_unique",
    "name": "varchar(100)",
    "xp": "integer_default_0",
    "level": "integer_default_1",
    "created_at": "timestamp_with_timezone",
    "updated_at": "timestamp_with_timezone"
  }
}`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/45 p-6 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="flex items-center gap-1.5 font-sans text-lg font-bold text-slate-100">
            <Compass className="h-5 w-5 text-amber-500" /> Planejamento Técnico Sênior (MVP)
          </h2>
          <p className="text-xs text-slate-400">
            Construção e Arquitetura para fins comerciais e portfólio de alta performance.
          </p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl self-start md:self-center border border-slate-800/60 font-sans text-xs">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'architecture' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" /> 1. Arquitetura
          </button>
          <button
            onClick={() => setActiveTab('ux')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'ux' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> 2. UX/UI Hooks
          </button>
          <button
            onClick={() => setActiveTab('sprints')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'sprints' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="h-3.5 w-3.5" /> 3. Sprints
          </button>
          <button
            onClick={() => setActiveTab('bottlenecks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'bottlenecks' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5" /> 4. Gargalos
          </button>
        </div>
      </div>

      <div className="mt-6 font-sans text-sm text-slate-300 leading-relaxed space-y-4">
        {activeTab === 'architecture' && (
          <div className="space-y-4 animate-feed-in">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
              1. Modulagem de Dados e Sincronização da Nuvem (Firebase / Supabase)
            </h3>
            <p className="text-slate-350">
              Para um aplicativo <strong>offline-first</strong> de portfólio, a modelagem dos esquemas deve carregar explicitamente dados de controle para evitar colisões e identificar exatamente quando registros locais diferem de seu estado sincronizado no banco primário.
            </p>

            <div className="relative">
              <div className="flex items-center justify-between rounded-t-xl bg-slate-950 px-4 py-2 border-t border-x border-slate-805">
                <span className="font-mono text-xs text-slate-400">schema_tasks_users.json</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(schemaCode)}
                  className="flex items-center gap-1 font-sans text-[11px] text-slate-500 hover:text-slate-300"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-b-xl border-b border-x border-slate-800 bg-slate-950/80 p-4 font-mono text-xs text-amber-500/90 leading-normal max-h-72">
                {schemaCode}
              </pre>
            </div>

            <h4 className="font-bold text-slate-200 mt-4 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Estratégia de Cache e Nuvem (Offline-First)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-955/30 p-3.5">
                <h5 className="font-semibold text-slate-100 text-xs uppercase mb-1">Passo 1: Gravação Otimista (Optimistic UI)</h5>
                <p className="text-xs text-slate-400">
                  Todas as escritas (inserções, marcações de complete, etc.) modificam primeiro o <strong>banco local (LocalStorage/SQLite)</strong> e atualizam o estado visual na hora. A tarefa é criada imediatamente com <code>is_synced = false</code>.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-955/30 p-3.5">
                <h5 className="font-semibold text-slate-100 text-xs uppercase mb-1">Passo 2: Background Synchronizer</h5>
                <p className="text-xs text-slate-400">
                  Um listener de rede (ex: <code>navigator.onLine</code>) é instanciado. Assim que a rede recupera sinal, inicia uma fila de transações enviando os registros que possuem <code>is_synced == false</code>, atualizando-os para <code>true</code> após confirmação.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ux' && (
          <div className="space-y-4 animate-feed-in">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
              2. Fluxo Principal do Usuário &amp; Alavancas Visuais de Retenção (UX/UI Hooks)
            </h3>
            
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-400 space-y-1 my-2 border border-slate-850">
                <div className="font-bold text-amber-500 text-sm font-sans mb-1">Fluxo Básico de Operações do MVP</div>
                <div>Abertura (Lê LocalStorage rápido) → Exibe Dashboard → Criação rápida de Tarefas (Inline ou Modal) → Cronometragem com Pomodoro → Conclusão com som sintetizado → Multiplicador de XP e animação de Level Up.</div>
              </div>

              <h4 className="font-bold text-slate-100 text-sm mt-4">3 Elementos de Micro-Interação para Turbinar Retenção:</h4>
              <ul className="space-y-3 pl-1">
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 mt-0.5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">1</span>
                  <div>
                    <strong className="text-slate-200">Recompensas de XP Auditivas (Chime de Sucesso):</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Usamos a Web Audio API nativa para tocar acordes cristalinos instantâneos ao concluir tarefas. Sem esperar requisições de servidores, o cérebro do usuário recebe um feedback dopaminérgico mecânico imediato.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 mt-0.5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">2</span>
                  <div>
                    <strong className="text-slate-200">Level-Up com Animação e Brilho Visual:</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Toda vez que a barra de experiência (XP) atinge o limite do nível de dificuldade, o aplicativo emite um som de vitória e aciona uma cortina retro de micro-animações, celebrando a consistência e o progresso do usuário.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 mt-0.5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">3</span>
                  <div>
                    <strong className="text-slate-200">Sincronizador Transparente de Badge "Nuvem Offline":</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Badges de status de sincronia (ícone de nuvem cortada laranja vs. nuvem verde com check) mostram ao profissional autônomo e estudante que seus dados estão sãos e salvos localmente mesmo sem internet. Transmite profissionalismo e paz de espírito.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sprints' && (
          <div className="space-y-4 animate-feed-in">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
              3. Cronograma de Desenvolvimento MVP em 4 Sprints Iterativos
            </h3>
            <p className="text-xs text-slate-400">
              Planejamento ideal para separar seus commits de portfólio no GitHub de maneira limpa, organizada e incremental.
            </p>

            <div className="space-y-4 mt-3">
              <div className="relative border-l-2 border-slate-800 pl-4 ml-2 space-y-4">
                <div className="relative">
                  <div className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 border border-slate-900" />
                  <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold text-amber-400 uppercase">Sprint 1</span>
                  <h4 className="font-bold text-slate-100 text-xs mt-1">Interface Polida &amp; Componentes Visuais (UI/Fidelidade)</h4>
                  <p className="text-xs text-slate-400">
                    Layout responsivo do dashboard, modal de tarefas, cards com gradientes finos e seletor de categorias. Configuração das fontes premium (Inter, JetBrains Mono).
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 border border-slate-900" />
                  <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold text-slate-500 uppercase">Sprint 2</span>
                  <h4 className="font-bold text-slate-100 text-xs mt-1">Banco Local (Storage) &amp; Context Gerenciador de CRUD</h4>
                  <p className="text-xs text-slate-400">
                    Criação do TaskProvider com React Context. Carregamento e persistência das modificações via localStorage. Teste de listagem, deleção real e checkboxes de conclusão.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 border border-slate-900" />
                  <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold text-slate-500 uppercase">Sprint 3</span>
                  <h4 className="font-bold text-slate-100 text-xs mt-1">Integração Pomodoro &amp; Engine de Gamificação (Dopamina/XP)</h4>
                  <p className="text-xs text-slate-400">
                    Instanciação do micro-módulo de Timer vinculável com as tarefas. Integração com Web Audio API para simular chimes, progressos reais de barras e XP dinâmico para gamificar a produtividade diária.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 border border-slate-900" />
                  <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold text-slate-500 uppercase">Sprint 4</span>
                  <h4 className="font-bold text-slate-100 text-xs mt-1">Engine de Sincronia da Nuvem &amp; Mecânica Anticolisão</h4>
                  <p className="text-xs text-slate-400">
                    Listeners de rede automáticos, simulação de envio com debounce (evitando floods). Resolução de conflitos baseados em "Última Edição Vence" (Last-Write-Wins timestamps).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bottlenecks' && (
          <div className="space-y-4 animate-feed-in">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
              4. Principais Desafios Técnicos de Sincronia Offline e Como Evitá-los
            </h3>

            <div className="space-y-3 mt-3 text-xs leading-relaxed">
              <div className="rounded-xl border border-slate-850 p-3 bg-slate-950/40">
                <h4 className="font-bold text-rose-400 flex items-center gap-1.5 mb-1 text-xs uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 1. Conflito de Modificações Simultâneas (Stale Override)
                </h4>
                <p className="text-slate-450 leading-relaxed">
                  <strong>O Desafio:</strong> Usuário modifica a tarefa sem internet no celular, e depois modifica a mesma tarefa via web. Quando ambos se reconectam, as alterações se atropelam.
                  <br />
                  <strong>Solução:</strong> Implementar timestamp granular de modificação <code>updated_at</code>. A sincronia do lado do servidor deve realizar uma validação simples: se o payload recebido tem <code>updated_at</code> mais novo do que o presente na Nuvem, salva. Senão, ignora e instrui o cliente a atualizar o cache local.
                </p>
              </div>

              <div className="rounded-xl border border-slate-850 p-3 bg-slate-950/40">
                <h4 className="font-bold text-rose-400 flex items-center gap-1.5 mb-1 text-xs uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 2. Limitações de Persistência no Safari (LocalStorage Eviction)
                </h4>
                <p className="text-slate-450 leading-relaxed">
                  <strong>O Desafio:</strong> O iOS Safari expurga chaves de LocalStorage se o usuário passar mais de 7 dias sem usar a aplicação PWA.
                  <br />
                  <strong>Solução:</strong> Em fases de escala pós-MVP de portfólio comercial, migrar de LocalStorage para <strong>IndexedDB</strong> (utilizando a biblioteca recomendada <code>localForage</code> ou <code>idb-keyval</code>) ou habilitar sincronização robusta via cookie persistente.
                </p>
              </div>

              <div className="rounded-xl border border-slate-850 p-3 bg-slate-950/40">
                <h4 className="font-bold text-rose-400 flex items-center gap-1.5 mb-1 text-xs uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 3. Notificações Push fora de sincronia (Stale Alerts)
                </h4>
                <p className="text-slate-450 leading-relaxed">
                  <strong>O Desafio:</strong> Se as tarefas são concluídas offline, mas os agendamentos de lembretes na Nuvem disparam avisos falsos pelo Firebase Cloud Messaging.
                  <br />
                  <strong>Solução:</strong> Marcar agendamentos de notificação do lado do Cliente usando <strong>Service Workers</strong> nativos locais no navegador / app (através de Local Notification APIs), cancelando-as imediatamente no dispositivo local logo que a tarefa for mudada, sem precisar de internet para conversar com o servidor FCM.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
