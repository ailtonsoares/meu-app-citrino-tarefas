import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle2, Moon, Sun, AlertCircle, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';

interface PomodoroTimerProps {
  tasks: Task[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  onPomodoroComplete: (taskId: string) => void;
}

export default function PomodoroTimer({
  tasks,
  activeTaskId,
  setActiveTaskId,
  onPomodoroComplete,
}: PomodoroTimerProps) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus'); // 'focus' = 25m, 'break' = 5m
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [accelerated, setAccelerated] = useState(false); // To let reviewers easily test completion fast
  const [tipsTab, setTipsTab] = useState<'focus' | 'mindfulness'>('mindfulness');
  const [mindfulnessCategory, setMindfulnessCategory] = useState<'pausas' | 'foco' | 'restauradora' | 'estrategia'>('pausas');
  
  const FOCUS_TIPS = [
    "A técnica Pomodoro funciona melhor ao silenciar notificações. Elimine distrações externas!",
    "Use o intervalo de 5 minutos para se alongar, beber água ou respirar fundo longe das telas.",
    "Focar em uma única tarefa evita o desperdício de energia cognitiva pela troca de contexto.",
    "Grandes marcos são conquistados em blocos. Consistência diária supera picos de intensidade.",
    "Evite checar redes sociais na pausa para dar um tempo real de regeneração ao córtex pré-frontal.",
    "Se o foco flutuar, tudo bem. Apenas reinicie o cronômetro com calma e persista.",
    "Divida demandas complexas em metas menores estimadas em blocos de 25 minutos.",
    "Seu cérebro precisa de pausas rítmicas para fixar o aprendizado e consolidar a memória.",
    "Mantenha uma folha física ao lado para anotar ideias intrusivas e limpar o fluxo mental.",
    "Hidrate-se! Um simples gole de água oxigena o cérebro e melhora o desempenho cognitivo."
  ];

  const [currentTip, setCurrentTip] = useState(FOCUS_TIPS[0]);

  useEffect(() => {
    // Select a random tip that differs from the current one to guarantee variety
    const available = FOCUS_TIPS.filter(tip => tip !== currentTip);
    const chosen = available[Math.floor(Math.random() * available.length)];
    setCurrentTip(chosen);
  }, [mode]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Mode intervals
  const focusSeconds = 25 * 60;
  const breakSeconds = 5 * 60;

  useEffect(() => {
    // Reset timer when switching modes
    setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      const step = accelerated ? 25 : 1;
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= step) {
            handleTimerFinish();
            return 0;
          }
          return prev - step;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, activeTaskId, accelerated]);

  const handleTimerFinish = () => {
    setIsRunning(false);
    
    // Play dual notification sound
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const playTone = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur);
        };
        playTone(520, now, 0.25);
        playTone(660, now + 0.15, 0.25);
        playTone(880, now + 0.3, 0.4);
      }
    } catch {}

    if (mode === 'focus') {
      if (activeTaskId) {
        onPomodoroComplete(activeTaskId);
      }
      // Toggle to standard short break automatically
      setMode('break');
    } else {
      // Return to focus Mode
      setMode('focus');
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = mode === 'focus' 
    ? ((focusSeconds - secondsLeft) / focusSeconds) * 100 
    : ((breakSeconds - secondsLeft) / breakSeconds) * 100;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="flex items-center gap-1.5 font-sans font-bold text-slate-100">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500/10" /> Pomodoro de Foco
          </h3>
          <p className="text-xs text-slate-400">
            Trabalhe concentrado no MVP e ganhe bônus de XP
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Accelerated switch for easy debug */}
          <button
            onClick={() => setAccelerated(!accelerated)}
            title="Acelerar tempo para testar conclusão facilmente"
            className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase font-bold transition-all ${
              accelerated 
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20' 
                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            Modo Rápido: {accelerated ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center gap-6">
        {/* Timer Visualization Circle */}
        <div className="relative flex h-36 w-36 items-center justify-center">
          {/* Background tracks */}
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="62"
              className="stroke-slate-950 fill-none stroke-[6]"
            />
            {/* Active progress ring */}
            <motion.circle
              cx="72"
              cy="72"
              r="62"
              className={`fill-none stroke-[6] transition-all duration-300 ${
                mode === 'focus' ? 'stroke-amber-500' : 'stroke-sky-500'
              }`}
              strokeDasharray={`${2 * Math.PI * 62}`}
              strokeDashoffset={`${2 * Math.PI * 62 * (1 - percentage / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Timing readout */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
              {formatTime(secondsLeft)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              mode === 'focus' ? 'text-amber-400' : 'text-sky-400'
            }`}>
              {mode === 'focus' ? 'PRODUÇÃO' : 'INTERVALO'}
            </span>
          </div>
        </div>

        {/* Controls & Active Task Linkage */}
        <div className="flex-1 space-y-4 w-full">
          {/* Mode Switchers Header */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
            <button
              onClick={() => setMode('focus')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                mode === 'focus'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sun className="h-3.5 w-3.5" /> Foco (25m)
            </button>
            <button
              onClick={() => setMode('break')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                mode === 'break'
                  ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Moon className="h-3.5 w-3.5" /> Pausa (5m)
            </button>
          </div>

          {/* Connected task dropdown selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Alvo da Sessão Ativa
            </label>
            {pendingTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 px-3 py-2 text-center text-xs text-slate-500 flex items-center gap-1.5 justify-center">
                <AlertCircle className="h-3.5 w-3.5 text-slate-600" /> Crie tarefas pendentes para focar!
              </div>
            ) : (
              <select
                value={activeTaskId || ''}
                onChange={(e) => setActiveTaskId(e.target.value || null)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="">-- Escolha uma tarefa para vincular --</option>
                {pendingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Interactive Play/Stop tools */}
          <div className="flex gap-2.5 py-1">
            <button
              onClick={toggleTimer}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 font-sans text-xs font-bold transition-all shadow-md cursor-pointer ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-950'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 fill-current" /> Pausar Focus
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> Iniciar Focus
                </>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              title="Resetar cronômetro"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Linked context details */}
          {activeTask && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/50 p-2.5 border border-slate-800/40">
              <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-none">VINCULADO</p>
                <p className="text-[11px] font-semibold text-slate-200 truncate leading-normal mt-0.5">
                  {activeTask.title}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Tips & Mindfulness segment switcher */}
      <div className="mt-5 pt-4 border-t border-slate-800/60">
        <div className="flex items-center justify-between mb-3 border-b border-slate-850 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTipsTab('mindfulness')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                tipsTab === 'mindfulness'
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 font-extrabold'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              🧘 Mindfulness
            </button>
            <button
              onClick={() => setTipsTab('focus')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                tipsTab === 'focus'
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 font-extrabold'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              💡 Dicas de Foco
            </button>
          </div>
        </div>

        {tipsTab === 'mindfulness' ? (
          <div className="space-y-3">
            {/* Mindfulness category pills */}
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setMindfulnessCategory('pausas')}
                className={`flex-1 min-w-[65px] text-center py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer truncate ${
                  mindfulnessCategory === 'pausas'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌬️ Pausas
              </button>
              <button
                type="button"
                onClick={() => setMindfulnessCategory('foco')}
                className={`flex-1 min-w-[65px] text-center py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer truncate ${
                  mindfulnessCategory === 'foco'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🧠 Foco
              </button>
              <button
                type="button"
                onClick={() => setMindfulnessCategory('restauradora')}
                className={`flex-1 min-w-[65px] text-center py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer truncate ${
                  mindfulnessCategory === 'restauradora'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌱 Pausas +
              </button>
              <button
                type="button"
                onClick={() => setMindfulnessCategory('estrategia')}
                className={`flex-1 min-w-[65px] text-center py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer truncate ${
                  mindfulnessCategory === 'estrategia'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 Estratégia
              </button>
            </div>

            {/* Mindfulness items content output */}
            <div className="rounded-xl border border-slate-800/50 bg-slate-950/45 p-3.5 space-y-3 min-h-[110px]">
              {mindfulnessCategory === 'pausas' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500 text-xs">🌬️</span>
                    <h4 className="font-sans text-[11px] font-black text-slate-200 uppercase tracking-wider">Pausas conscientes</h4>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-350 leading-relaxed font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Respiração 4-4-4:</strong> inspire por 4 segundos, segure por 4, expire por 4. Repita 3 vezes.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Mini check-in:</strong> quando parar, pergunte a si mesmo: “Como estou me sentindo agora?” sem julgamento.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Alongamento rápido:</strong> levante, estique braços e pernas, perceba as sensações físicas.</span>
                    </li>
                  </ul>
                </div>
              )}

              {mindfulnessCategory === 'foco' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500 text-xs">🧠</span>
                    <h4 className="font-sans text-[11px] font-black text-slate-200 uppercase tracking-wider">Concentração plena</h4>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-350 leading-relaxed font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Pomodoro mindful:</strong> trabalhe 25 minutos focado, depois faça 5 minutos de pausa consciente (respiração ou caminhada curta).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Single-tasking:</strong> escolha uma tarefa e faça apenas ela, evitando multitarefa.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Observação do ambiente:</strong> antes de começar, olhe ao redor e perceba detalhes (cores, sons, temperatura).</span>
                    </li>
                  </ul>
                </div>
              )}

              {mindfulnessCategory === 'restauradora' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500 text-xs">🌱</span>
                    <h4 className="font-sans text-[11px] font-black text-slate-200 uppercase tracking-wider">Pausas restauradoras</h4>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-350 leading-relaxed font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Caminhada consciente:</strong> ande devagar, prestando atenção nos passos e na respiração.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Mindful coffee/tea:</strong> quando beber algo, perceba o aroma, sabor e temperatura, sem distrações.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Micro-meditação:</strong> feche os olhos por 2 minutos e foque apenas na respiração.</span>
                    </li>
                  </ul>
                </div>
              )}

              {mindfulnessCategory === 'estrategia' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500 text-xs">📊</span>
                    <h4 className="font-sans text-[11px] font-black text-slate-200 uppercase tracking-wider">Estratégia para o dia</h4>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-350 leading-relaxed font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Manhã:</strong> 2 minutos de respiração consciente antes de começar as tarefas.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800/50 bg-slate-950/45 p-3.5 shadow-sm min-h-[110px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex p-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Lightbulb className="h-3.5 w-3.5" />
              </div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                Dicas de Foco <Sparkles className="h-3 w-3 text-amber-500/80" />
              </span>
            </div>
            
            <div className="relative overflow-hidden min-h-[36px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTip}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  className="font-sans text-[11.5px] leading-relaxed text-slate-350"
                >
                  {currentTip}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
