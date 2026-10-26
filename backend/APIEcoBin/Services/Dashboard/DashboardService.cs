using ApiEcoBin.Data;
using ApiEcoBin.Dto.Dashboard;
using ApiEcoBin.Enums;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Services.Dashboard
{
    public class DashboardService(AppDbContext context, ILogger<DashboardService> logger) : IDashboardInterface
    {
        private readonly AppDbContext _context = context;
        private readonly ILogger<DashboardService> _logger = logger;

        private const int LimiarCheio = 90;
        private const int LimiarEsvaziado = 20;
        private const decimal KgPorLeituraReciclavel = 2m;
        private const decimal Co2PorKg = 1.5m;
        private const decimal ArvoresPor100Kg = 1m;
        private const decimal LitrosAguaPorLitroOleo = 25000m;
        private const int MesesHistoricoOleo = 6;
        private const double MaxIntervaloLeiturasHoras = 2;
        private const int LimiarAtencao = 60;
        private const int BateriaBaixa = 20;
        private const int HorasPrevisaoColetor = 24;

        private static bool EhReciclavel(TipoLixeira tipo) =>
            tipo is TipoLixeira.Reciclavel or TipoLixeira.Papel or TipoLixeira.Plastico
                 or TipoLixeira.Metal or TipoLixeira.Vidro;

        public async Task<ResponseModel<List<NivelPorPeriodoDTO>>> GetNivelAoLongoDoTempoAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null,
            GranularidadePeriodo granularidade = GranularidadePeriodo.Dia)
        {
            var response = new ResponseModel<List<NivelPorPeriodoDTO>>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var telemetrias = await _context.Telemetrias
                    .Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df && t.NivelOcupacao.HasValue)
                    .OrderBy(t => t.Momento).ToListAsync();

                var agrupado = telemetrias.GroupBy(t => t.SensorId).Select(g =>
                {
                    var sensor = g.First().Sensor;
                    var serie = g.GroupBy(t => TruncarPeriodo(t.Momento!.Value, granularidade))
                        .OrderBy(p => p.Key)
                        .Select(p => new PontoTemporalDTO
                        {
                            Periodo = p.Key,
                            MediaNivel = Math.Round((decimal)p.Average(t => t.NivelOcupacao!.Value), 1),
                            MaximoNivel = p.Max(t => t.NivelOcupacao)
                        }).ToList();
                    return new NivelPorPeriodoDTO
                    {
                        SensorId = g.Key,
                        NomeSensor = sensor?.Nome ?? $"Sensor {g.Key}",
                        Serie = serie
                    };
                }).ToList();

                response.Status = true;
                response.Dados = agrupado;
                response.Mensagem = "Serie temporal calculada.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro nivel ao longo do tempo"); }
            return response;
        }

        public async Task<ResponseModel<VolumeReciclavelDTO>> GetVolumeReciclavelAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<VolumeReciclavelDTO>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df && t.NivelOcupacao.HasValue && t.Sensor.Tipo != TipoLixeira.Oleo)
                    .ToListAsync();

                var porSensor = telemetrias.GroupBy(t => new { t.SensorId, t.Sensor!.Nome, t.Sensor.Tipo }).Select(g =>
                {
                    bool isRec = EhReciclavel(g.Key.Tipo);
                    return new VolumeReciclavelPorSensorDTO
                    {
                        SensorId = g.Key.SensorId,
                        NomeSensor = g.Key.Nome ?? $"Sensor {g.Key.SensorId}",
                        LeiturasReciclavel = isRec ? g.Count() : 0,
                        LeiturasLixoComum = isRec ? 0 : g.Count()
                    };
                }).ToList();

                int totalRec = porSensor.Sum(s => s.LeiturasReciclavel);
                int totalCom = porSensor.Sum(s => s.LeiturasLixoComum);
                int total = totalRec + totalCom;

                response.Status = true;
                response.Dados = new VolumeReciclavelDTO
                {
                    TotalLeituras = total, LeiturasReciclavel = totalRec, LeiturasLixoComum = totalCom,
                    PercentualReciclavel = total > 0 ? Math.Round((decimal)totalRec / total * 100, 1) : 0,
                    PorSensor = porSensor
                };
                response.Mensagem = "Volume reciclavel calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro volume reciclavel"); }
            return response;
        }

        public async Task<ResponseModel<List<RankingLixeiraDTO>>> GetRankingLixeirasAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<List<RankingLixeiraDTO>>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df && t.NivelOcupacao.HasValue && t.Sensor.Tipo != TipoLixeira.Oleo)
                    .OrderBy(t => t.SensorId).ThenBy(t => t.Momento).ToListAsync();

                var ranking = telemetrias.GroupBy(t => new { t.SensorId, t.Sensor!.Nome }).Select(g =>
                {
                    var niveis = g.Select(t => t.NivelOcupacao!.Value).ToList();
                    return new RankingLixeiraDTO
                    {
                        SensorId = g.Key.SensorId,
                        NomeSensor = g.Key.Nome ?? $"Sensor {g.Key.SensorId}",
                        MediaOcupacao = Math.Round((decimal)niveis.Average(), 1),
                        TotalEsvaziamentos = ContarEsvaziamentos(g.OrderBy(t => t.Momento).Select(t => t.NivelOcupacao!.Value).ToList()),
                        AlertasCheio = niveis.Count(n => n >= LimiarCheio)
                    };
                }).OrderByDescending(r => r.MediaOcupacao).ToList();

                response.Status = true;
                response.Dados = ranking;
                response.Mensagem = "Ranking calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro ranking"); }
            return response;
        }

        public async Task<ResponseModel<List<EvolucaoMensalDTO>>> GetEvolucaoMensalAsync(int condominioId, int meses = 6)
        {
            var response = new ResponseModel<List<EvolucaoMensalDTO>>();
            try
            {
                var di = DateTime.UtcNow.AddMonths(-meses);
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.NivelOcupacao.HasValue && t.Sensor.Tipo != TipoLixeira.Oleo)
                    .ToListAsync();

                var evolucao = telemetrias
                    .GroupBy(t => new { t.Momento!.Value.Year, t.Momento!.Value.Month })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                    .Select(g =>
                    {
                        var niveis = g.Select(t => t.NivelOcupacao!.Value).ToList();
                        var data = new DateTime(g.Key.Year, g.Key.Month, 1);
                        return new EvolucaoMensalDTO
                        {
                            Ano = g.Key.Year, Mes = g.Key.Month,
                            MesNome = data.ToString("MMM/yyyy"),
                            MediaOcupacaoGeral = Math.Round((decimal)niveis.Average(), 1),
                            TotalColetas = ContarEsvaziamentos(g.OrderBy(t => t.Momento).Select(t => t.NivelOcupacao!.Value).ToList()),
                            TotalAlertas = niveis.Count(n => n >= LimiarCheio)
                        };
                    }).ToList();

                response.Status = true;
                response.Dados = evolucao;
                response.Mensagem = "Evolucao mensal calculada.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro evolucao mensal"); }
            return response;
        }

        public async Task<ResponseModel<List<EficienciaColetaDTO>>> GetEficienciaColetaAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<List<EficienciaColetaDTO>>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df && t.NivelOcupacao.HasValue && t.Sensor.Tipo != TipoLixeira.Oleo)
                    .OrderBy(t => t.SensorId).ThenBy(t => t.Momento).ToListAsync();

                var eficiencia = telemetrias.GroupBy(t => new { t.SensorId, t.Sensor!.Nome }).Select(g =>
                {
                    var nivelOrdenado = g.Select(t => t.NivelOcupacao!.Value).ToList();
                    int total = ContarEsvaziamentos(nivelOrdenado);
                    int necessarios = nivelOrdenado.Count(n => n >= LimiarCheio) > 0 ? total : total;
                    int evitaveis = Math.Max(0, total - necessarios);
                    decimal efic = total > 0 ? Math.Round((decimal)necessarios / total * 100, 1) : 100m;
                    return new EficienciaColetaDTO
                    {
                        SensorId = g.Key.SensorId,
                        NomeSensor = g.Key.Nome ?? $"Sensor {g.Key.SensorId}",
                        TotalEsvaziamentos = total,
                        EsvaziamentosNecessarios = necessarios,
                        EsvaziamentosEvitaveis = evitaveis,
                        PercentualEficiencia = efic
                    };
                }).ToList();

                response.Status = true;
                response.Dados = eficiencia;
                response.Mensagem = "Eficiencia calculada.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro eficiencia"); }
            return response;
        }

        public async Task<ResponseModel<List<TempoMedioEnchimentoDTO>>> GetTempoMedioEnchimentoAsync(int condominioId)
        {
            var response = new ResponseModel<List<TempoMedioEnchimentoDTO>>();
            try
            {
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.NivelOcupacao.HasValue && t.Momento.HasValue)
                    .OrderBy(t => t.SensorId).ThenBy(t => t.Momento).ToListAsync();

                var resultado = telemetrias.GroupBy(t => new { t.SensorId, t.Sensor!.Nome }).Select(g =>
                {
                    var leituras = g.OrderBy(t => t.Momento).ToList();
                    double? tempoMedio = CalcularTempoMedioEnchimentoHoras(leituras);
                    var ultimaNivel = leituras.LastOrDefault()?.NivelOcupacao;
                    DateTime? previsao = null;
                    if (tempoMedio.HasValue && ultimaNivel.HasValue && ultimaNivel.Value < LimiarCheio)
                        previsao = DateTime.UtcNow.AddHours(tempoMedio.Value
                            * (LimiarCheio - Math.Max(ultimaNivel.Value, LimiarEsvaziado)) / (double)(LimiarCheio - LimiarEsvaziado));
                    return new TempoMedioEnchimentoDTO
                    {
                        SensorId = g.Key.SensorId,
                        NomeSensor = g.Key.Nome ?? $"Sensor {g.Key.SensorId}",
                        TempoMedioHoras = tempoMedio.HasValue ? Math.Round(tempoMedio.Value, 1) : null,
                        NivelAtual = ultimaNivel,
                        PrevisaoCheia = previsao
                    };
                }).ToList();

                response.Status = true;
                response.Dados = resultado;
                response.Mensagem = "Tempo medio calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro tempo enchimento"); }
            return response;
        }

        public async Task<ResponseModel<AlertasOcorrenciasDTO>> GetAlertasOcorrenciasAsync(int condominioId)
        {
            var response = new ResponseModel<AlertasOcorrenciasDTO>();
            try
            {
                var offlineLimite = DateTime.UtcNow.AddHours(-2);
                var sensores = await _context.Sensores.Where(s => s.CondominioId == condominioId).ToListAsync();
                var ultimasTelemetrias = await _context.Telemetrias
                    .Where(t => t.Sensor!.CondominioId == condominioId)
                    .GroupBy(t => t.SensorId)
                    .Select(g => g.OrderByDescending(t => t.Momento).First()).ToListAsync();

                var detalhes = sensores.Select(s =>
                {
                    var ultima = ultimasTelemetrias.FirstOrDefault(t => t.SensorId == s.Id);
                    return new AlertaSensorDTO
                    {
                        SensorId = s.Id,
                        NomeSensor = s.Nome ?? $"Sensor {s.Id}",
                        NivelAtual = ultima?.NivelOcupacao ?? 0,
                        UltimaLeitura = ultima?.Momento,
                        Lotado = ultima?.NivelOcupacao >= LimiarCheio,
                        Offline = ultima == null || ultima.Momento < offlineLimite
                    };
                }).ToList();

                int totalAlertas30d = await _context.Telemetrias
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.NivelOcupacao >= LimiarCheio && t.Momento >= DateTime.UtcNow.AddDays(-30))
                    .CountAsync();

                response.Status = true;
                response.Dados = new AlertasOcorrenciasDTO
                {
                    TotalAlertasCheio = totalAlertas30d,
                    SensoresLotadosAgora = detalhes.Count(d => d.Lotado),
                    SensoresOffline = detalhes.Count(d => d.Offline),
                    Detalhes = detalhes
                };
                response.Mensagem = "Alertas verificados.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro alertas"); }
            return response;
        }

        public async Task<ResponseModel<ImpactoAmbientalDTO>> GetImpactoAmbientalAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<ImpactoAmbientalDTO>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df && t.NivelOcupacao.HasValue && t.Sensor.Tipo != TipoLixeira.Oleo)
                    .ToListAsync();

                int leiturasRec = telemetrias.Count(t => t.Sensor != null && EhReciclavel(t.Sensor.Tipo));
                int coletas = telemetrias.GroupBy(t => t.SensorId)
                    .Sum(g => ContarEsvaziamentos(g.OrderBy(t => t.Momento).Select(t => t.NivelOcupacao!.Value).ToList()));
                decimal kg = leiturasRec > 0 ? leiturasRec * KgPorLeituraReciclavel : coletas * KgPorLeituraReciclavel;

                response.Status = true;
                response.Dados = new ImpactoAmbientalDTO
                {
                    KgReciclados = kg,
                    Co2Evitado = Math.Round(kg * Co2PorKg, 2),
                    ArvoresSalvas = Math.Round(kg / 100 * ArvoresPor100Kg, 2),
                    TotalColetas = coletas,
                    Periodo = $"{di:dd/MM/yyyy} - {df:dd/MM/yyyy}"
                };
                response.Mensagem = "Impacto ambiental calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro impacto ambiental"); }
            return response;
        }

        public async Task<ResponseModel<List<UsoPorDiaSemanaDTO>>> GetUsoPorDiaSemanaAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<List<UsoPorDiaSemanaDTO>>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df && t.NivelOcupacao.HasValue && t.Sensor.Tipo != TipoLixeira.Oleo)
                    .ToListAsync();

                string[] nomesDias = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
                var uso = telemetrias
                    .GroupBy(t => (int)t.Momento!.Value.DayOfWeek)
                    .Select(g => new UsoPorDiaSemanaDTO
                    {
                        NumeroDia = g.Key,
                        DiaSemana = nomesDias[g.Key],
                        MediaOcupacao = Math.Round((decimal)g.Average(t => t.NivelOcupacao!.Value), 1),
                        TotalLeituras = g.Count()
                    }).OrderBy(d => d.NumeroDia).ToList();

                response.Status = true;
                response.Dados = uso;
                response.Mensagem = "Uso por dia da semana calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro uso dia semana"); }
            return response;
        }

        public async Task<ResponseModel<EconomiaEstimadaDTO>> GetEconomiaEstimadaAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null, decimal custoMedioColeta = 150m)
        {
            var response = new ResponseModel<EconomiaEstimadaDTO>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var telemetrias = await _context.Telemetrias.Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df && t.NivelOcupacao.HasValue && t.Sensor.Tipo != TipoLixeira.Oleo)
                    .OrderBy(t => t.SensorId).ThenBy(t => t.Momento).ToListAsync();

                int coletasRealizadas = telemetrias.GroupBy(t => t.SensorId)
                    .Sum(g => ContarEsvaziamentos(g.OrderBy(t => t.Momento).Select(t => t.NivelOcupacao!.Value).ToList()));

                int evitadas = telemetrias.GroupBy(t => t.SensorId).Sum(g =>
                {
                    var niveis = g.OrderBy(t => t.Momento).Select(t => t.NivelOcupacao!.Value).ToList();
                    int count = 0;
                    bool estavaCheio = false;
                    foreach (var n in niveis)
                    {
                        if (n >= LimiarCheio) estavaCheio = true;
                        if (n <= LimiarEsvaziado)
                        {
                            if (!estavaCheio) count++;
                            estavaCheio = false;
                        }
                    }
                    return count;
                });

                response.Status = true;
                response.Dados = new EconomiaEstimadaDTO
                {
                    ColetasRealizadas = coletasRealizadas,
                    ColetasEvitadas = evitadas,
                    CustoMedioColeta = custoMedioColeta,
                    EconomiaTotalEstimada = evitadas * custoMedioColeta,
                    Periodo = $"{di:dd/MM/yyyy} - {df:dd/MM/yyyy}"
                };
                response.Mensagem = "Economia estimada calculada.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro economia"); }
            return response;
        }

        public async Task<ResponseModel<EnergiaSolarDTO>> GetEnergiaSolarAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<EnergiaSolarDTO>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;
                var nomes = await _context.Sensores.Where(s => s.CondominioId == condominioId)
                    .ToDictionaryAsync(s => s.Id, s => s.Nome);
                var telemetrias = await _context.Telemetrias
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= di && t.Momento <= df
                        && (t.Bateria.HasValue || t.TensaoBateria.HasValue || t.Carregando.HasValue))
                    .OrderBy(t => t.SensorId).ThenBy(t => t.Momento).ToListAsync();

                double horasMonitoradas = 0, horasCarregando = 0, energiaWh = 0;
                var sensores = new List<EnergiaSensorDTO>();

                foreach (var g in telemetrias.GroupBy(t => t.SensorId))
                {
                    var leituras = g.ToList();
                    double descargaPct = 0, descargaHoras = 0;

                    // Cada par de leituras consecutivas é um intervalo; lacunas longas (sensor offline) são ignoradas
                    for (int i = 1; i < leituras.Count; i++)
                    {
                        var a = leituras[i - 1];
                        var b = leituras[i];
                        double dt = (b.Momento!.Value - a.Momento!.Value).TotalHours;
                        if (dt <= 0 || dt > MaxIntervaloLeiturasHoras) continue;

                        horasMonitoradas += dt;
                        if (a.Carregando == true) horasCarregando += dt;

                        var tensao = a.TensaoBateria ?? a.TensaoPainel;
                        if (a.CorrentePainel.HasValue && tensao.HasValue)
                            energiaWh += (double)(tensao.Value * a.CorrentePainel.Value / 1000m) * dt;

                        if (a.Carregando != true && b.Carregando != true && a.Bateria.HasValue && b.Bateria.HasValue)
                        {
                            descargaPct += a.Bateria.Value - b.Bateria.Value;
                            descargaHoras += dt;
                        }
                    }

                    var ultima = leituras[^1];
                    double? taxaDescarga = descargaHoras >= 1 && descargaPct > 0 ? descargaPct / descargaHoras : null;
                    sensores.Add(new EnergiaSensorDTO
                    {
                        SensorId = g.Key,
                        NomeSensor = nomes.GetValueOrDefault(g.Key) ?? $"Sensor {g.Key}",
                        BateriaAtual = ultima.Bateria,
                        TensaoBateria = ultima.TensaoBateria,
                        TensaoPainel = ultima.TensaoPainel,
                        Carregando = ultima.Carregando,
                        UltimaLeitura = ultima.Momento,
                        AutonomiaHoras = taxaDescarga.HasValue && ultima.Bateria.HasValue
                            ? Math.Round((decimal)(ultima.Bateria.Value / taxaDescarga.Value), 1)
                            : null
                    });
                }

                var porHora = telemetrias
                    .GroupBy(t => ParaHorarioLocal(t.Momento!.Value).Hour)
                    .OrderBy(h => h.Key)
                    .Select(h =>
                    {
                        var comBateria = h.Where(t => t.Bateria.HasValue).ToList();
                        var comCarga = h.Where(t => t.Carregando.HasValue).ToList();
                        return new EnergiaPorHoraDTO
                        {
                            Hora = h.Key,
                            BateriaMedia = comBateria.Count > 0 ? Math.Round((decimal)comBateria.Average(t => t.Bateria!.Value), 1) : null,
                            PercentualCarregando = comCarga.Count > 0 ? Math.Round((decimal)comCarga.Count(t => t.Carregando == true) / comCarga.Count * 100, 1) : 0,
                            TotalLeituras = h.Count()
                        };
                    }).ToList();

                var recentes = sensores.Where(s => s.UltimaLeitura >= DateTime.UtcNow.AddHours(-MaxIntervaloLeiturasHoras)).ToList();
                var comBateriaAtual = sensores.Where(s => s.BateriaAtual.HasValue).ToList();
                decimal fracaoCarga = horasMonitoradas > 0 ? (decimal)(horasCarregando / horasMonitoradas) : 0;
                bool possuiCorrente = telemetrias.Any(t => t.CorrentePainel.HasValue);

                response.Status = true;
                response.Dados = new EnergiaSolarDTO
                {
                    PossuiDados = telemetrias.Count > 0,
                    PossuiMedicaoCorrente = possuiCorrente,
                    BateriaMedia = comBateriaAtual.Count > 0 ? Math.Round((decimal)comBateriaAtual.Average(s => s.BateriaAtual!.Value), 1) : null,
                    SensoresCarregandoAgora = recentes.Count(s => s.Carregando == true),
                    TotalSensores = sensores.Count,
                    PercentualTempoCarregando = Math.Round(fracaoCarga * 100, 1),
                    HorasCargaPorDia = Math.Round(fracaoCarga * 24, 1),
                    EnergiaGeradaWh = possuiCorrente ? Math.Round((decimal)energiaWh, 1) : null,
                    PorHora = porHora,
                    Sensores = sensores
                };
                response.Mensagem = "Energia solar calculada.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro energia solar"); }
            return response;
        }

        public async Task<ResponseModel<OleoResumoDTO>> GetOleoResumoAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<OleoResumoDTO>();
            try
            {
                var di = dataInicio ?? DateTime.UtcNow.AddDays(-30);
                var df = dataFim ?? DateTime.UtcNow;

                var recipientes = await _context.Sensores
                    .Where(s => s.CondominioId == condominioId && s.Tipo == TipoLixeira.Oleo).ToListAsync();
                var ids = recipientes.Select(s => s.Id).ToList();
                var ultimas = await _context.Telemetrias
                    .Where(t => ids.Contains(t.SensorId) && t.NivelOcupacao.HasValue)
                    .GroupBy(t => t.SensorId)
                    .Select(g => g.OrderByDescending(t => t.Momento).First()).ToListAsync();

                var recipientesDto = recipientes.Select(s =>
                {
                    var ultima = ultimas.FirstOrDefault(t => t.SensorId == s.Id);
                    int? nivel = ultima?.NivelOcupacao;
                    return new RecipienteOleoDTO
                    {
                        SensorId = s.Id,
                        NomeSensor = s.Nome ?? $"Sensor {s.Id}",
                        NivelAtual = nivel,
                        CapacidadeLitros = s.CapacidadeLitros,
                        LitrosAtuais = nivel.HasValue && s.CapacidadeLitros.HasValue
                            ? Math.Round(s.CapacidadeLitros.Value * nivel.Value / 100m, 1)
                            : null,
                        Cheio = nivel >= LimiarCheio,
                        UltimaLeitura = ultima?.Momento
                    };
                }).ToList();

                var inicioMeses = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-(MesesHistoricoOleo - 1));
                var desde = di < inicioMeses ? di : inicioMeses;
                var coletas = await _context.OleoColetas
                    .Include(c => c.Sensor).Include(c => c.Usuario)
                    .Where(c => c.CondominioId == condominioId && c.DataColeta >= desde)
                    .OrderByDescending(c => c.DataColeta).ToListAsync();

                var noPeriodo = coletas.Where(c => c.DataColeta >= di && c.DataColeta <= df).ToList();
                decimal litrosPeriodo = noPeriodo.Sum(c => c.Litros);

                var porMes = Enumerable.Range(0, MesesHistoricoOleo).Select(i => inicioMeses.AddMonths(i)).Select(m =>
                {
                    var doMes = coletas.Where(c => c.DataColeta.Year == m.Year && c.DataColeta.Month == m.Month).ToList();
                    return new OleoMensalDTO
                    {
                        Ano = m.Year, Mes = m.Month,
                        MesNome = m.ToString("MMM/yyyy"),
                        Litros = doMes.Sum(c => c.Litros),
                        TotalColetas = doMes.Count
                    };
                }).ToList();

                response.Status = true;
                response.Dados = new OleoResumoDTO
                {
                    LitrosColetadosPeriodo = litrosPeriodo,
                    TotalColetasPeriodo = noPeriodo.Count,
                    LitrosArmazenadosAgora = recipientesDto.Sum(r => r.LitrosAtuais ?? 0),
                    AguaPreservadaLitros = litrosPeriodo * LitrosAguaPorLitroOleo,
                    Recipientes = recipientesDto,
                    PorMes = porMes,
                    UltimasColetas = coletas.Take(5).Select(c => new Dto.OleoColetas.OleoColetaDTO
                    {
                        Id = c.Id,
                        CondominioId = c.CondominioId,
                        SensorId = c.SensorId,
                        NomeSensor = c.Sensor?.Nome,
                        Litros = c.Litros,
                        Destino = c.Destino,
                        Observacao = c.Observacao,
                        DataColeta = c.DataColeta,
                        RegistradoPor = c.Usuario?.Nome
                    }).ToList()
                };
                response.Mensagem = "Resumo de oleo calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro resumo oleo"); }
            return response;
        }

        public async Task<ResponseModel<PainelColetorDTO>> GetPainelColetorAsync(int condominioId)
        {
            var response = new ResponseModel<PainelColetorDTO>();
            try
            {
                var agora = DateTime.UtcNow;
                var offlineLimite = agora.AddHours(-MaxIntervaloLeiturasHoras);
                var inicioSemana = agora.AddDays(-7);
                var inicioHoje = InicioDoDiaLocalEmUtc(agora);

                var sensores = await _context.Sensores.Where(s => s.CondominioId == condominioId).ToListAsync();
                var ids = sensores.Select(s => s.Id).ToList();

                var recentes = await _context.Telemetrias
                    .Where(t => ids.Contains(t.SensorId) && t.Momento >= inicioSemana && t.NivelOcupacao.HasValue)
                    .OrderBy(t => t.Momento).ToListAsync();
                var ultimas = await _context.Telemetrias
                    .Where(t => ids.Contains(t.SensorId))
                    .GroupBy(t => t.SensorId)
                    .Select(g => g.OrderByDescending(t => t.Momento).First()).ToListAsync();

                var painel = new PainelColetorDTO { AtualizadoEm = agora };

                foreach (var s in sensores)
                {
                    var ultima = ultimas.FirstOrDefault(t => t.SensorId == s.Id);
                    var leituras = recentes.Where(t => t.SensorId == s.Id).ToList();
                    bool offline = ultima?.Momento == null || ultima.Momento < offlineLimite;

                    // Coleta = a lixeira passou de cheia (>= 90%) para esvaziada (<= 20%)
                    DateTime? cheioDesde = null;
                    bool estavaCheio = false;
                    foreach (var t in leituras)
                    {
                        if (t.NivelOcupacao >= LimiarCheio)
                        {
                            if (!estavaCheio) cheioDesde = t.Momento;
                            estavaCheio = true;
                        }
                        else if (estavaCheio && t.NivelOcupacao <= LimiarEsvaziado)
                        {
                            painel.ColetasSemana++;
                            if (t.Momento >= inicioHoje) painel.ColetasHoje++;
                            estavaCheio = false;
                            cheioDesde = null;
                        }
                    }

                    if (ultima == null || offline || ultima.Bateria < BateriaBaixa)
                    {
                        painel.Atencao.Add(new LixeiraAtencaoDTO
                        {
                            SensorId = s.Id,
                            NomeSensor = s.Nome ?? $"Sensor {s.Id}",
                            Motivo = ultima == null ? "Nunca enviou leituras" : offline ? "Sem sinal" : "Bateria baixa",
                            Bateria = ultima?.Bateria,
                            UltimaLeitura = ultima?.Momento,
                            Latitude = s.Latitude,
                            Longitude = s.Longitude
                        });
                    }
                    if (ultima == null) continue;

                    int nivel = ultima.NivelOcupacao ?? 0;
                    var item = new LixeiraColetaDTO
                    {
                        SensorId = s.Id,
                        NomeSensor = s.Nome ?? $"Sensor {s.Id}",
                        TipoId = (int)s.Tipo,
                        Tipo = NomeTipo(s.Tipo),
                        NivelAtual = nivel,
                        Lotado = nivel >= LimiarCheio,
                        Offline = offline,
                        UltimaLeitura = ultima.Momento,
                        CheioDesde = nivel >= LimiarCheio ? cheioDesde : null,
                        Latitude = s.Latitude,
                        Longitude = s.Longitude,
                        CapacidadeLitros = s.CapacidadeLitros,
                        LitrosAtuais = s.CapacidadeLitros.HasValue ? Math.Round(s.CapacidadeLitros.Value * nivel / 100m, 1) : null
                    };

                    if (nivel >= LimiarAtencao)
                    {
                        painel.ParaRecolher.Add(item);
                    }
                    else if (!offline && CalcularTempoMedioEnchimentoHoras(leituras) is double horasParaEncher)
                    {
                        // Tempo médio de 20% a 90%, proporcional ao que falta a partir do nível atual
                        double faltando = (LimiarCheio - Math.Max(nivel, LimiarEsvaziado)) / (double)(LimiarCheio - LimiarEsvaziado);
                        var previsao = agora.AddHours(horasParaEncher * faltando);
                        if (previsao <= agora.AddHours(HorasPrevisaoColetor))
                        {
                            item.PrevisaoCheia = previsao;
                            painel.EnchemEmBreve.Add(item);
                        }
                    }
                }

                painel.ParaRecolher = painel.ParaRecolher
                    .OrderByDescending(i => i.Lotado).ThenBy(i => i.CheioDesde).ThenByDescending(i => i.NivelAtual).ToList();
                painel.EnchemEmBreve = painel.EnchemEmBreve.OrderBy(i => i.PrevisaoCheia).ToList();
                painel.LitrosOleoSemana = await _context.OleoColetas
                    .Where(c => c.CondominioId == condominioId && c.DataColeta >= inicioSemana)
                    .SumAsync(c => (decimal?)c.Litros) ?? 0;

                response.Status = true;
                response.Dados = painel;
                response.Mensagem = "Painel do coletor calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro painel do coletor"); }
            return response;
        }

        private static string NomeTipo(TipoLixeira tipo) => tipo switch
        {
            TipoLixeira.Organico => "Orgânico",
            TipoLixeira.Reciclavel => "Reciclável",
            TipoLixeira.Papel => "Papel",
            TipoLixeira.Plastico => "Plástico",
            TipoLixeira.Metal => "Metal",
            TipoLixeira.Vidro => "Vidro",
            TipoLixeira.Rejeito => "Rejeito",
            TipoLixeira.Oleo => "Óleo de cozinha",
            _ => "Não definido"
        };

        public async Task<ResponseModel<DashboardGeralDTO>> GetDashboardGeralAsync(
            int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<DashboardGeralDTO>();
            try
            {
                var alertas = await GetAlertasOcorrenciasAsync(condominioId);
                var impacto = await GetImpactoAmbientalAsync(condominioId, dataInicio, dataFim);
                var economia = await GetEconomiaEstimadaAsync(condominioId, dataInicio, dataFim);
                var ranking = await GetRankingLixeirasAsync(condominioId, dataInicio, dataFim);
                var usoDia = await GetUsoPorDiaSemanaAsync(condominioId, dataInicio, dataFim);
                var evolucao = await GetEvolucaoMensalAsync(condominioId);
                var energia = await GetEnergiaSolarAsync(condominioId, dataInicio, dataFim);
                var oleo = await GetOleoResumoAsync(condominioId, dataInicio, dataFim);

                response.Status = true;
                response.Dados = new DashboardGeralDTO
                {
                    Alertas = alertas.Dados ?? new(),
                    ImpactoAmbiental = impacto.Dados ?? new(),
                    Economia = economia.Dados ?? new(),
                    RankingLixeiras = ranking.Dados ?? [],
                    UsoPorDiaSemana = usoDia.Dados ?? [],
                    EvolucaoMensal = evolucao.Dados ?? [],
                    EnergiaSolar = energia.Dados ?? new(),
                    Oleo = oleo.Dados ?? new()
                };
                response.Mensagem = "Dashboard geral calculado.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro dashboard geral"); }
            return response;
        }

        private static readonly TimeZoneInfo FusoBrasil = ObterFusoBrasil();

        private static TimeZoneInfo ObterFusoBrasil()
        {
            foreach (var id in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }
            return TimeZoneInfo.Utc;
        }

        private static DateTime InicioDoDiaLocalEmUtc(DateTime utc) =>
            TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(ParaHorarioLocal(utc).Date, DateTimeKind.Unspecified), FusoBrasil);

        // Momentos são gravados em UTC; a curva solar precisa do horário local para fazer sentido
        private static DateTime ParaHorarioLocal(DateTime utc) =>
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), FusoBrasil);

        private static DateTime TruncarPeriodo(DateTime dt, GranularidadePeriodo g) => g switch
        {
            GranularidadePeriodo.Hora => new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour, 0, 0),
            GranularidadePeriodo.Semana => dt.AddDays(-(int)dt.DayOfWeek).Date,
            GranularidadePeriodo.Mes => new DateTime(dt.Year, dt.Month, 1),
            _ => dt.Date
        };

        private static int ContarEsvaziamentos(List<int> niveis)
        {
            int count = 0;
            bool estavaCheio = false;
            foreach (var n in niveis)
            {
                if (n >= LimiarCheio) estavaCheio = true;
                if (estavaCheio && n <= LimiarEsvaziado) { count++; estavaCheio = false; }
            }
            return count;
        }

        private static double? CalcularTempoMedioEnchimentoHoras(IEnumerable<TelemetriasModel> leituras)
        {
            var lista = leituras.Where(t => t.Momento.HasValue && t.NivelOcupacao.HasValue).OrderBy(t => t.Momento).ToList();
            var tempos = new List<double>();
            DateTime? inicio = null;
            foreach (var t in lista)
            {
                // Conta só ciclos que começam vazios (<= 20%); leituras ainda cheias à espera da coleta não iniciam ciclo
                if (t.NivelOcupacao <= LimiarEsvaziado) inicio = t.Momento;
                else if (t.NivelOcupacao >= LimiarCheio && inicio.HasValue)
                {
                    tempos.Add((t.Momento!.Value - inicio.Value).TotalHours);
                    inicio = null;
                }
            }
            return tempos.Count > 0 ? tempos.Average() : null;
        }
    }
}
