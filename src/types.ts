export type TipoEvento = 'restaurante' | 'balada' | 'show' | 'festival' | 'bar';

export type Turno = 'manha' | 'tarde' | 'noite' | 'madrugada';

export type GeneroMusical = 'rock' | 'pop' | 'sertanejo' | 'funk' | 'eletronica' | 'indie' | 'hip-hop' | 'reggae' | 'samba' | 'pagode' | 'forro';
export type TipoComida = 'brasileira' | 'italiana' | 'japonesa' | 'mexicana' | 'francesa' | 'chinesa' | 'indiana' | 'vegana' | 'vegetariana' | 'fast-food' | 'churrasco' | 'pizzaria';
export type Publico = 'LGBT' | 'Hetero';

export type Preco = 'gratuito' | 'pago';
export type PrecoFiltro = 'gratuito' | 'ate-50' | 'ate-100' | 'ate-200' | 'qualquer-valor';

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

export interface Localizacao {
  latitude: number;
  longitude: number;
}

export interface HorarioPorDia {
  dia: DiaSemana;
  horarioAbertura: string; // formato HH:mm (ex: "20:00")
  horarioFechamento: string; // formato HH:mm (ex: "02:00")
  preco: Preco; // tipo de entrada para este dia ('gratuito', 'pago')
  valorEntrada?: number; // valor de entrada para este dia (obrigatório se preco === 'pago')
}

export interface Evento {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoEvento;
  data?: string; // ISO string (opcional para eventos recorrentes)
  turno: Turno; // calculado automaticamente baseado em horarioAbertura e horarioFechamento
  horarioAbertura: string; // formato HH:mm (ex: "20:00") - usado para eventos não recorrentes ou como padrão
  horarioFechamento: string; // formato HH:mm (ex: "02:00") - usado para eventos não recorrentes ou como padrão
  preco: Preco;
  valorEntrada?: number; // valor exato da entrada em reais (obrigatório quando preco === 'pago')
  endereco: string;
  localizacao?: Localizacao; // opcional, apenas endereço é necessário
  imagem?: string; // base64 ou URL (opcional)
  avaliacao: number; // de 0 a 5
  criadoEm: string;
  criadoPor: string; // ID do usuário que criou o evento
  criadorNome?: string; // Nome do criador do evento (apenas para admin)
  criadorEmail?: string; // Email do criador do evento (apenas para admin)
  aprovado: 'pendente' | 'aprovado' | 'rejeitado'; // status do evento
  aprovadoPor?: string; // ID do admin que aprovou
  aprovadoEm?: string; // data de aprovação
  distancia?: number; // em metros, calculado
  recorrente: boolean; // se é evento recorrente
  diasSemana?: DiaSemana[]; // dias da semana que o evento acontece (apenas se recorrente) - DEPRECATED: usar horariosPorDia
  horariosPorDia?: HorarioPorDia[]; // horários individualizados por dia da semana (apenas se recorrente)
  // Campos específicos por tipo
  generoMusical?: GeneroMusical[]; // para baladas, shows, festivais, bares (pode ter múltiplos)
  tipoComida?: TipoComida; // para restaurantes
  temBrinquedoteca?: boolean; // para bares
  publico?: Publico; // para baladas
}

export type TipoOrdenacao = 'distancia' | 'nota' | 'preco' | 'data' | 'nome';

export interface Filtros {
  data?: string;
  turno?: Turno;
  tipo?: TipoEvento;
  preco?: PrecoFiltro;
  busca?: string;
  // Filtros específicos por tipo
  generoMusical?: GeneroMusical[]; // pode filtrar por múltiplos gêneros
  tipoComida?: TipoComida;
  temBrinquedoteca?: boolean;
  publico?: Publico;
}

export interface Voto {
  eventoId: string;
  nota: number; // de 0 a 5
  data: string; // ISO string
}

export interface SugestaoAlteracao {
  id: string;
  eventoId: string;
  usuarioId: string;
  // Campos alterados (apenas os que foram alterados)
  nome?: string;
  descricao?: string;
  tipo?: TipoEvento;
  data?: string;
  horarioAbertura?: string;
  horarioFechamento?: string;
  preco?: Preco;
  valorEntrada?: number;
  endereco?: string;
  localizacao?: Localizacao;
  imagem?: string;
  recorrente?: boolean;
  diasSemana?: DiaSemana[];
  generoMusical?: GeneroMusical[];
  tipoComida?: TipoComida;
  temBrinquedoteca?: boolean;
  publico?: Publico;
  // Status
  status: 'pendente' | 'aprovada' | 'rejeitada';
  aprovadaPor?: string;
  aprovadaEm?: string;
  rejeitadaPor?: string;
  rejeitadaEm?: string;
  motivoRejeicao?: string;
  comentario?: string; // Comentário/motivo da sugestão (visível apenas para admin)
  criadaEm: string;
  // Informações adicionais (do backend)
  eventoNome?: string;
  usuarioNome?: string;
  usuarioEmail?: string;
}

