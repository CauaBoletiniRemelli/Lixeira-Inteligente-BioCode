namespace ApiEcoBin.Dto.Dashboard
{
    public class NivelPorPeriodoDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public List<PontoTemporalDTO> Serie { get; set; } = [];
    }

    public class PontoTemporalDTO
    {
        public DateTime Periodo { get; set; }
        public decimal MediaNivel { get; set; }
        public int? MaximoNivel { get; set; }
    }

    public class VolumeReciclavelDTO
    {
        public int TotalLeituras { get; set; }
        public int LeiturasLixoComum { get; set; }
        public int LeiturasReciclavel { get; set; }
        public decimal PercentualReciclavel { get; set; }
        public List<VolumeReciclavelPorSensorDTO> PorSensor { get; set; } = [];
    }

    public class VolumeReciclavelPorSensorDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public int LeiturasLixoComum { get; set; }
        public int LeiturasReciclavel { get; set; }
    }

    public class RankingLixeiraDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public decimal MediaOcupacao { get; set; }
        public int TotalEsvaziamentos { get; set; }
        public int AlertasCheio { get; set; }
    }

    public class EvolucaoMensalDTO
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
        public string MesNome { get; set; } = string.Empty;
        public decimal MediaOcupacaoGeral { get; set; }
        public int TotalColetas { get; set; }
        public int TotalAlertas { get; set; }
    }

    public class EficienciaColetaDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public int TotalEsvaziamentos { get; set; }
        public int EsvaziamentosNecessarios { get; set; }
        public int EsvaziamentosEvitaveis { get; set; }
        public decimal PercentualEficiencia { get; set; }
    }

    public class TempoMedioEnchimentoDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public double? TempoMedioHoras { get; set; }
        public int? NivelAtual { get; set; }
        public DateTime? PrevisaoCheia { get; set; }
    }

    public class AlertasOcorrenciasDTO
    {
        public int TotalAlertasCheio { get; set; }
        public int SensoresLotadosAgora { get; set; }
        public int SensoresOffline { get; set; }
        public List<AlertaSensorDTO> Detalhes { get; set; } = [];
    }

    public class AlertaSensorDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public int NivelAtual { get; set; }
        public DateTime? UltimaLeitura { get; set; }
        public bool Lotado { get; set; }
        public bool Offline { get; set; }
    }

    public class ImpactoAmbientalDTO
    {
        public decimal KgReciclados { get; set; }
        public decimal Co2Evitado { get; set; }
        public decimal ArvoresSalvas { get; set; }
        public int TotalColetas { get; set; }
        public string Periodo { get; set; } = string.Empty;
    }

    public class UsoPorDiaSemanaDTO
    {
        public string DiaSemana { get; set; } = string.Empty;
        public int NumeroDia { get; set; }
        public decimal MediaOcupacao { get; set; }
        public int TotalLeituras { get; set; }
    }

    public class EconomiaEstimadaDTO
    {
        public int ColetasRealizadas { get; set; }
        public int ColetasEvitadas { get; set; }
        public decimal CustoMedioColeta { get; set; }
        public decimal EconomiaTotalEstimada { get; set; }
        public string Periodo { get; set; } = string.Empty;
    }

    /// <summary>Visão operacional para o coletor: o que recolher agora e o que vai encher em breve.</summary>
    public class PainelColetorDTO
    {
        public List<LixeiraColetaDTO> ParaRecolher { get; set; } = [];
        public List<LixeiraColetaDTO> EnchemEmBreve { get; set; } = [];
        public List<LixeiraAtencaoDTO> Atencao { get; set; } = [];
        public int ColetasHoje { get; set; }
        public int ColetasSemana { get; set; }
        public decimal LitrosOleoSemana { get; set; }
        public DateTime AtualizadoEm { get; set; }
    }

    public class LixeiraColetaDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public int TipoId { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public int NivelAtual { get; set; }
        public bool Lotado { get; set; }
        public bool Offline { get; set; }
        public DateTime? UltimaLeitura { get; set; }
        /// <summary>Desde quando a lixeira está acima de 90%.</summary>
        public DateTime? CheioDesde { get; set; }
        /// <summary>Quando deve chegar a 90%, pelo ritmo de enchimento dos últimos dias.</summary>
        public DateTime? PrevisaoCheia { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? LitrosAtuais { get; set; }
        public decimal? CapacidadeLitros { get; set; }
    }

    public class LixeiraAtencaoDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public string Motivo { get; set; } = string.Empty;
        public int? Bateria { get; set; }
        public DateTime? UltimaLeitura { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }

    public class DashboardGeralDTO
    {
        public AlertasOcorrenciasDTO Alertas { get; set; } = new();
        public ImpactoAmbientalDTO ImpactoAmbiental { get; set; } = new();
        public EconomiaEstimadaDTO Economia { get; set; } = new();
        public List<RankingLixeiraDTO> RankingLixeiras { get; set; } = [];
        public List<UsoPorDiaSemanaDTO> UsoPorDiaSemana { get; set; } = [];
        public List<EvolucaoMensalDTO> EvolucaoMensal { get; set; } = [];
        public EnergiaSolarDTO EnergiaSolar { get; set; } = new();
        public OleoResumoDTO Oleo { get; set; } = new();
    }

    public class EnergiaSolarDTO
    {
        /// <summary>Há leituras de bateria/painel no período.</summary>
        public bool PossuiDados { get; set; }
        /// <summary>Alguma lixeira envia corrente do painel (INA219); sem isso não há energia em Wh.</summary>
        public bool PossuiMedicaoCorrente { get; set; }
        public decimal? BateriaMedia { get; set; }
        public int SensoresCarregandoAgora { get; set; }
        public int TotalSensores { get; set; }
        /// <summary>Fração do tempo monitorado em que o painel estava carregando a bateria (0–100).</summary>
        public decimal PercentualTempoCarregando { get; set; }
        /// <summary>Média de horas de carga solar por dia, por lixeira.</summary>
        public decimal HorasCargaPorDia { get; set; }
        public decimal? EnergiaGeradaWh { get; set; }
        public List<EnergiaPorHoraDTO> PorHora { get; set; } = [];
        public List<EnergiaSensorDTO> Sensores { get; set; } = [];
    }

    public class EnergiaPorHoraDTO
    {
        public int Hora { get; set; }
        public decimal? BateriaMedia { get; set; }
        public decimal PercentualCarregando { get; set; }
        public int TotalLeituras { get; set; }
    }

    public class EnergiaSensorDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public int? BateriaAtual { get; set; }
        public decimal? TensaoBateria { get; set; }
        public decimal? TensaoPainel { get; set; }
        public bool? Carregando { get; set; }
        public DateTime? UltimaLeitura { get; set; }
        /// <summary>Horas estimadas até a bateria acabar sem sol, pela taxa de descarga observada.</summary>
        public decimal? AutonomiaHoras { get; set; }
    }

    public class OleoResumoDTO
    {
        public decimal LitrosColetadosPeriodo { get; set; }
        public int TotalColetasPeriodo { get; set; }
        public decimal LitrosArmazenadosAgora { get; set; }
        /// <summary>Estimativa de água protegida (litros), considerando 1 L de óleo para 25 mil L de água.</summary>
        public decimal AguaPreservadaLitros { get; set; }
        public List<RecipienteOleoDTO> Recipientes { get; set; } = [];
        public List<OleoMensalDTO> PorMes { get; set; } = [];
        public List<Dto.OleoColetas.OleoColetaDTO> UltimasColetas { get; set; } = [];
    }

    public class RecipienteOleoDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public int? NivelAtual { get; set; }
        public decimal? CapacidadeLitros { get; set; }
        public decimal? LitrosAtuais { get; set; }
        public bool Cheio { get; set; }
        public DateTime? UltimaLeitura { get; set; }
    }

    public class OleoMensalDTO
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
        public string MesNome { get; set; } = string.Empty;
        public decimal Litros { get; set; }
        public int TotalColetas { get; set; }
    }

    public enum GranularidadePeriodo
    {
        Hora,
        Dia,
        Semana,
        Mes
    }
}