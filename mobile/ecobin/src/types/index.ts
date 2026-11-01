export type UserRole = 'coletor' | 'sindico' | 'admin' | 'proprietario';

export enum TipoLixeira {
  NaoDefinido = 0,
  Organico = 1,
  Reciclavel = 2,
  Papel = 3,
  Plastico = 4,
  Metal = 5,
  Vidro = 6,
  Rejeito = 7,
  Oleo = 8,
}

export interface DashboardGeral {
  alertas: DashboardAlertas;
  impactoAmbiental: ImpactoAmbiental;
  economia: Economia;
  rankingLixeiras: RankingItem[];
  usoPorDiaSemana: UsoDiaSemana[];
  evolucaoMensal: EvolucaoMensal[];
  energiaSolar: EnergiaSolar;
  oleo: OleoResumo;
}

export interface LixeiraColeta {
  sensorId: number;
  nomeSensor: string;
  tipoId: number;
  tipo: string;
  nivelAtual: number;
  lotado: boolean;
  offline: boolean;
  ultimaLeitura: string | null;
  cheioDesde: string | null;
  previsaoCheia: string | null;
  latitude: number | null;
  longitude: number | null;
  litrosAtuais: number | null;
  capacidadeLitros: number | null;
}

export interface LixeiraAtencao {
  sensorId: number;
  nomeSensor: string;
  motivo: string;
  bateria: number | null;
  ultimaLeitura: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PainelColetor {
  paraRecolher: LixeiraColeta[];
  enchemEmBreve: LixeiraColeta[];
  atencao: LixeiraAtencao[];
  coletasHoje: number;
  coletasSemana: number;
  litrosOleoSemana: number;
  atualizadoEm: string;
}

export interface EnergiaSolar {
  possuiDados: boolean;
  possuiMedicaoCorrente: boolean;
  bateriaMedia: number | null;
  sensoresCarregandoAgora: number;
  totalSensores: number;
  percentualTempoCarregando: number;
  horasCargaPorDia: number;
  energiaGeradaWh: number | null;
  porHora: { hora: number; bateriaMedia: number | null; percentualCarregando: number; totalLeituras: number }[];
  sensores: {
    sensorId: number;
    nomeSensor: string;
    bateriaAtual: number | null;
    tensaoBateria: number | null;
    tensaoPainel: number | null;
    carregando: boolean | null;
    ultimaLeitura: string | null;
    autonomiaHoras: number | null;
  }[];
}

export interface OleoColeta {
  id: number;
  condominioId: number;
  sensorId: number | null;
  nomeSensor: string | null;
  litros: number;
  destino: string | null;
  observacao: string | null;
  dataColeta: string;
  registradoPor: string | null;
}

export interface OleoResumo {
  litrosColetadosPeriodo: number;
  totalColetasPeriodo: number;
  litrosArmazenadosAgora: number;
  aguaPreservadaLitros: number;
  recipientes: {
    sensorId: number;
    nomeSensor: string;
    nivelAtual: number | null;
    capacidadeLitros: number | null;
    litrosAtuais: number | null;
    cheio: boolean;
    ultimaLeitura: string | null;
  }[];
  porMes: { ano: number; mes: number; mesNome: string; litros: number; totalColetas: number }[];
  ultimasColetas: OleoColeta[];
}

export interface NivelTempoSensor {
  sensorId: number;
  nomeSensor: string;
  serie: { periodo: string; mediaNivel: number; maximoNivel: number }[];
}

export interface VolumeReciclavel {
  totalLeituras: number;
  leiturasReciclavel: number;
  leiturasLixoComum: number;
  percentualReciclavel: number;
  porSensor: {
    sensorId: number;
    nomeSensor: string;
    leiturasReciclavel: number;
    leiturasLixoComum: number;
  }[];
}

export interface RankingItem {
  sensorId: number;
  nomeSensor: string;
  mediaOcupacao: number;
  totalEsvaziamentos: number;
  alertasCheio: number;
}

export interface EvolucaoMensal {
  ano: number;
  mes: number;
  mesNome: string;
  mediaOcupacaoGeral: number;
  totalColetas: number;
  totalAlertas: number;
}

export interface EficienciaColeta {
  sensorId: number;
  nomeSensor: string;
  totalEsvaziamentos: number;
  esvaziamentosNecessarios: number;
  esvaziamentosEvitaveis: number;
  percentualEficiencia: number;
}

export interface TempoEnchimento {
  sensorId: number;
  nomeSensor: string;
  tempoMedioHoras: number | null;
  nivelAtual: number;
  previsaoCheia: string | null;
}

export interface DashboardAlertas {
  totalAlertasCheio: number;
  sensoresLotadosAgora: number;
  sensoresOffline: number;
  detalhes: {
    sensorId: number;
    nomeSensor: string;
    nivelAtual: number;
    ultimaLeitura: string;
    lotado: boolean;
    offline: boolean;
  }[];
}

export interface ImpactoAmbiental {
  kgReciclados: number;
  co2Evitado: number;
  arvoresSalvas: number;
  totalColetas: number;
  periodo: string;
}

export interface UsoDiaSemana {
  numeroDia: number;
  diaSemana: string;
  mediaOcupacao: number;
  totalLeituras: number;
}

export interface Economia {
  coletasRealizadas: number;
  coletasEvitadas: number;
  custoMedioColeta: number;
  economiaTotalEstimada: number;
  periodo: string;
}

export interface LixeiraStatus {
  sensorId: number;
  nome: string;
  tipoLixeira: string;
  nivelOcupacao: number;
  statusCor: 'verde' | 'amarelo' | 'vermelho';
  statusLabel: 'Livre' | 'Enchendo' | 'Lotada';
  latitude: number;
  longitude: number;
  ultimaLeitura: string;
}

export interface ColetaHistorico {
  sensorId: number;
  nomeSensor: string;
  dataColeta: string;
}

export interface Bin {
  id: string;
  location: string;
  fillLevel: number;
  status: 'normal' | 'warning' | 'full';
  lastUpdate: Date;
  type: 'organic' | 'recyclable' | 'general';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  condominiumName?: string;
  condominiumId?: number;
}

export interface Collection {
  id: string;
  binId: string;
  date: Date;
  weight: number;
  type: string;
}

export interface Sensor {
  id: string;
  binId: string;
  name: string;
  status: 'active' | 'inactive';
  batteryLevel: number;
  lastReading: Date;
}

export interface Condominium {
  id: string;
  name: string;
  address: string;
  managerId: string;
  sensorsCount: number;
}
