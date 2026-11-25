import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Activity, Users, Coins, ChevronDown, ChevronUp,
  RefreshCw, AlertCircle, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api, { getApiError } from '../services/api';

interface LogEntry {
  id: number;
  tabelaNome: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  idRegistroAfetado: number;
  usuarioExecutorId: number | null;
  usuarioProprietarioId: number | null;
  dadosAnteriores: Record<string, unknown> | null;
  dadosNovos: Record<string, unknown> | null;
  dataHora: string;
}

interface PageResponse {
  content: LogEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

type TabKey = 'atividade' | 'conta' | 'economia';
type Operacao = 'TODAS' | 'INSERT' | 'UPDATE' | 'DELETE';

const TABS: { key: TabKey; label: string; icon: typeof Activity; color: string; endpoint: string }[] = [
  { key: 'atividade', label: 'Atividades', icon: Activity,   color: 'text-game-cyan',   endpoint: '/api/admin/logs/atividade' },
  { key: 'conta',     label: 'Contas',     icon: Users,      color: 'text-brand-500',   endpoint: '/api/admin/logs/conta'     },
  { key: 'economia',  label: 'Economia',   icon: Coins,      color: 'text-game-yellow', endpoint: '/api/admin/logs/economia'  },
];

const OP_COLOR: Record<string, string> = {
  INSERT: 'bg-game-green/10 text-game-green border-green-500/20',
  UPDATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function JsonViewer({ data, label }: { data: Record<string, unknown> | null; label: string }) {
  if (!data) return <p className="text-slate-600 text-xs italic">—</p>;
  return (
    <div>
      <p className="text-[9px] font-black tracking-widest uppercase text-slate-500 mb-1">{label}</p>
      <pre className="text-[10px] text-slate-300 bg-navy-900 border border-navy-600 rounded-lg p-3 overflow-x-auto max-h-48 leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function OperacaoBadge({ op }: { op: string }) {
  return (
    <span className={`inline-block text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border ${OP_COLOR[op] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {op}
    </span>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(false);
  const hasDetail = entry.dadosAnteriores !== null || entry.dadosNovos !== null;

  return (
    <>
      <tr
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={`border-b border-navy-700/50 transition-colors ${hasDetail ? 'cursor-pointer hover:bg-navy-700/30' : ''}`}
      >
        <td className="px-3 py-2.5 text-slate-500 text-xs tabular-nums">{entry.id}</td>
        <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{entry.tabelaNome}</td>
        <td className="px-3 py-2.5"><OperacaoBadge op={entry.operacao} /></td>
        <td className="px-3 py-2.5 text-white text-xs tabular-nums">{entry.idRegistroAfetado}</td>
        <td className="px-3 py-2.5 text-slate-400 text-xs tabular-nums">{entry.usuarioExecutorId ?? '—'}</td>
        <td className="px-3 py-2.5 text-slate-400 text-xs tabular-nums">{entry.usuarioProprietarioId ?? '—'}</td>
        <td className="px-3 py-2.5 text-slate-500 text-[10px] whitespace-nowrap">
          {new Date(entry.dataHora).toLocaleString('pt-BR')}
        </td>
        <td className="px-3 py-2.5 text-slate-600 text-xs">
          {hasDetail
            ? open ? <ChevronUp size={13} /> : <ChevronDown size={13} />
            : null}
        </td>
      </tr>
      {open && (
        <tr className="bg-navy-900/40">
          <td colSpan={8} className="px-5 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <JsonViewer data={entry.dadosAnteriores} label="Dados anteriores" />
              <JsonViewer data={entry.dadosNovos}      label="Dados novos" />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState<TabKey>('atividade');
  const [pagina, setPagina] = useState(0);
  const [filtroOp, setFiltroOp] = useState<Operacao>('TODAS');
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const tab = TABS.find((t) => t.key === activeTab)!;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params: Record<string, unknown> = { pagina, tamanho: 50 };
      if (filtroOp !== 'TODAS') params.operacao = filtroOp;
      const { data } = await api.get(tab.endpoint, { params });
      if (data?.content !== undefined) {
        setPageData(data as PageResponse);
      } else if (Array.isArray(data)) {
        setPageData({ content: data, totalElements: data.length, totalPages: 1, number: 0, size: data.length });
      } else {
        setPageData({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 });
      }
    } catch (err) {
      setErro(getApiError(err));
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagina, filtroOp]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPagina(0);
    setFiltroOp('TODAS');
  };

  return (
    <div className="max-w-6xl space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
          <ShieldAlert size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-white">Admin · Logs</h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">Auditoria de operações</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-600 bg-navy-800 hover:border-navy-500 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === key
                ? 'border-brand-500/40 bg-brand-500/10 text-white'
                : 'border-navy-600 bg-navy-800 text-slate-500 hover:text-white hover:border-navy-500'
            }`}
          >
            <Icon size={13} className={activeTab === key ? 'text-brand-500' : color} />
            {label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Operação:</span>
        {(['TODAS', 'INSERT', 'UPDATE', 'DELETE'] as Operacao[]).map((op) => (
          <button
            key={op}
            onClick={() => { setFiltroOp(op); setPagina(0); }}
            className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded border transition-all ${
              filtroOp === op
                ? op === 'TODAS'
                  ? 'bg-white/10 border-white/20 text-white'
                  : `${OP_COLOR[op]} opacity-100`
                : 'border-navy-600 text-slate-600 hover:text-slate-400 hover:border-navy-500'
            }`}
          >
            {op}
          </button>
        ))}
        {pageData && (
          <span className="ml-auto text-slate-500 text-xs tabular-nums">
            {pageData.totalElements.toLocaleString('pt-BR')} registros
          </span>
        )}
      </div>

      {/* Error */}
      {erro && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          <AlertCircle size={18} />
          <p className="text-sm">{erro}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-brand-500 animate-spin" />
          </div>
        ) : !pageData || pageData.content.length === 0 ? (
          <div className="text-center py-16">
            <ShieldAlert size={32} className="mx-auto mb-3 text-navy-600" />
            <p className="text-slate-500 text-sm font-black tracking-widest uppercase">
              {erro ? 'Endpoint não disponível' : 'Nenhum registro encontrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-600 bg-navy-900/50">
                  {['ID', 'Tabela', 'Operação', 'Registro', 'Executor', 'Proprietário', 'Data/Hora', ''].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[9px] font-black tracking-widest uppercase text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((entry) => (
                  <LogRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0 || loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-600 bg-navy-800 hover:border-navy-500 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} />
            Anterior
          </button>
          <span className="text-slate-500 text-xs font-bold tabular-nums">
            Página {pagina + 1} de {pageData.totalPages}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(pageData.totalPages - 1, p + 1))}
            disabled={pagina >= pageData.totalPages - 1 || loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-600 bg-navy-800 hover:border-navy-500 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próxima
            <ChevronRight size={13} />
          </button>
        </div>
      )}

    </div>
  );
}
