using ApiEcoBin.Data;
using ApiEcoBin.Dto.Telemetrias;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ApiEcoBin.Services.Telemetrias
{
    public class TelemetriasService : ITelemetriasInterface
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TelemetriasService> _logger;

        public TelemetriasService(AppDbContext context, ILogger<TelemetriasService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ResponseModel<TelemetriaResponseDTO>> CreateTelemetriaAsync(TelemetriaCreateDTO dto)
        {
            var response = new ResponseModel<TelemetriaResponseDTO>();

            try
            {
                var sensor = await _context.Sensores.FindAsync(dto.SensorId);
                if (sensor == null)
                {
                    response.Status = false;
                    response.Mensagem = "Sensor não encontrado.";
                    return response;
                }

                var telemetria = new TelemetriasModel
                {
                    SensorId = dto.SensorId,
                    NivelOcupacao = dto.NivelOcupacao,
                    Bateria = dto.Bateria,
                    Temperatura = dto.Temperatura,
                    TensaoBateria = dto.TensaoBateria,
                    TensaoPainel = dto.TensaoPainel,
                    CorrentePainel = dto.CorrentePainel,
                    Carregando = dto.Carregando ?? InferirCarregando(dto.TensaoPainel, dto.TensaoBateria),
                    Momento = dto.Momento ?? DateTime.UtcNow,
                    DadosBrutos = dto.DadosBrutos
                };

                _context.Telemetrias.Add(telemetria);

                if (dto.NivelOcupacao.HasValue)
                {
                    sensor.Status = dto.NivelOcupacao.Value >= 90 ? 2 : 1;
                }

                await _context.SaveChangesAsync();

                var responseData = new TelemetriaResponseDTO
                {
                    Id = telemetria.Id,
                    SensorId = telemetria.SensorId,
                    Momento = telemetria.Momento ?? DateTime.UtcNow,
                    NivelOcupacao = telemetria.NivelOcupacao,
                    AlertaGerado = dto.NivelOcupacao >= 90,
                    Mensagem = dto.NivelOcupacao >= 90
                        ? "Alerta: Lixeira quase cheia!"
                        : "Telemetria registrada com sucesso."
                };

                response.Status = true;
                response.Mensagem = "Telemetria criada com sucesso.";
                response.Dados = responseData;

                _logger.LogInformation($"Telemetria criada: Sensor {dto.SensorId}, Nível {dto.NivelOcupacao}%");
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = $"Erro ao criar telemetria: {ex.Message}";
                _logger.LogError(ex, "Erro ao criar telemetria");
            }

            return response;
        }

        // Sem sensor de corrente, a carga é inferida pela tensão: o painel só carrega a bateria quando a supera.
        private static bool? InferirCarregando(decimal? tensaoPainel, decimal? tensaoBateria) =>
            tensaoPainel.HasValue && tensaoBateria.HasValue ? tensaoPainel.Value > tensaoBateria.Value : null;

        public async Task<ResponseModel<TelemetriaResponseDTO>> CreateTelemetriaArduinoAsync(TelemetriaArduinoDTO dto)
        {
            try
            {
                var telemetriaDTO = new TelemetriaCreateDTO
                {
                    SensorId = dto.SensorId,
                    NivelOcupacao = (int)Math.Round(dto.NivelLixo),
                    Bateria = dto.Bateria,
                    Temperatura = dto.Temperatura.HasValue ? (decimal)dto.Temperatura.Value : null,
                    TensaoBateria = dto.TensaoBateria.HasValue ? Math.Round((decimal)dto.TensaoBateria.Value, 2) : null,
                    TensaoPainel = dto.TensaoPainel.HasValue ? Math.Round((decimal)dto.TensaoPainel.Value, 2) : null,
                    CorrentePainel = dto.CorrentePainel.HasValue ? Math.Round((decimal)dto.CorrentePainel.Value, 2) : null,
                    Carregando = dto.Carregando,
                    Momento = !string.IsNullOrWhiteSpace(dto.DataHora)
                        ? DateTime.Parse(dto.DataHora)
                        : DateTime.UtcNow,
                    DadosBrutos = JsonSerializer.Serialize(new
                    {
                        nivelLixo = dto.NivelLixo,
                        temperatura = dto.Temperatura,
                        umidade = dto.Umidade,
                        distancia = dto.Distancia,
                        capacidade = dto.Capacidade,
                        alertaCheio = dto.AlertaCheio,
                        bateria = dto.Bateria,
                        tensaoBateria = dto.TensaoBateria,
                        tensaoPainel = dto.TensaoPainel,
                        correntePainel = dto.CorrentePainel,
                        carregando = dto.Carregando,
                        timestamp = dto.DataHora
                    })
                };

                return await CreateTelemetriaAsync(telemetriaDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar telemetria do Arduino");
                return new ResponseModel<TelemetriaResponseDTO>
                {
                    Status = false,
                    Mensagem = $"Erro ao processar dados do Arduino: {ex.Message}"
                };
            }
        }

        public async Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasAsync()
        {
            var response = new ResponseModel<List<TelemetriasModel>>();

            try
            {
                var telemetrias = await _context.Telemetrias
                    .Include(t => t.Sensor)
                    .OrderByDescending(t => t.Momento)
                    .Take(1000) 
                    .ToListAsync();

                response.Status = true;
                response.Dados = telemetrias;
                response.Mensagem = $"{telemetrias.Count} telemetrias encontradas.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao buscar telemetrias");
            }

            return response;
        }

        public async Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasFiltroAsync(TelemetriaFiltroDTO filtro)
        {
            var response = new ResponseModel<List<TelemetriasModel>>();

            try
            {
                var query = _context.Telemetrias
                    .Include(t => t.Sensor)
                    .AsQueryable();

                if (filtro.SensorId.HasValue)
                    query = query.Where(t => t.SensorId == filtro.SensorId.Value);

                if (filtro.CondominioId.HasValue)
                    query = query.Where(t => t.Sensor!.CondominioId == filtro.CondominioId.Value);

                if (filtro.DataInicio.HasValue)
                    query = query.Where(t => t.Momento >= filtro.DataInicio.Value);

                if (filtro.DataFim.HasValue)
                    query = query.Where(t => t.Momento <= filtro.DataFim.Value);

                if (filtro.NivelMinimoOcupacao.HasValue)
                    query = query.Where(t => t.NivelOcupacao >= filtro.NivelMinimoOcupacao.Value);

                if (filtro.NivelMaximoOcupacao.HasValue)
                    query = query.Where(t => t.NivelOcupacao <= filtro.NivelMaximoOcupacao.Value);

                var telemetrias = await query
                    .OrderByDescending(t => t.Momento)
                    .Skip(filtro.Skip)
                    .Take(filtro.Take)
                    .ToListAsync();

                response.Status = true;
                response.Dados = telemetrias;
                response.Mensagem = $"{telemetrias.Count} telemetrias encontradas.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao buscar telemetrias com filtro");
            }

            return response;
        }

        public async Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasBySensorAsync(int sensorId, int limit = 100)
        {
            var response = new ResponseModel<List<TelemetriasModel>>();

            try
            {
                var telemetrias = await _context.Telemetrias
                    .Where(t => t.SensorId == sensorId)
                    .OrderByDescending(t => t.Momento)
                    .Take(limit)
                    .ToListAsync();

                response.Status = true;
                response.Dados = telemetrias;
                response.Mensagem = $"{telemetrias.Count} telemetrias encontradas.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, $"Erro ao buscar telemetrias do sensor {sensorId}");
            }

            return response;
        }

        public async Task<ResponseModel<TelemetriasModel>> GetUltimaTelemetriaAsync(int sensorId)
        {
            var response = new ResponseModel<TelemetriasModel>();

            try
            {
                var telemetria = await _context.Telemetrias
                    .Where(t => t.SensorId == sensorId)
                    .OrderByDescending(t => t.Momento)
                    .FirstOrDefaultAsync();

                if (telemetria == null)
                {
                    response.Status = false;
                    response.Mensagem = "Nenhuma telemetria encontrada para este sensor.";
                    return response;
                }

                response.Status = true;
                response.Dados = telemetria;
                response.Mensagem = "Última telemetria encontrada.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, $"Erro ao buscar última telemetria do sensor {sensorId}");
            }

            return response;
        }

        public async Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasByCondominioAsync(int condominioId)
        {
            var response = new ResponseModel<List<TelemetriasModel>>();

            try
            {
                var telemetrias = await _context.Telemetrias
                    .Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId)
                    .OrderByDescending(t => t.Momento)
                    .Take(1000)
                    .ToListAsync();

                response.Status = true;
                response.Dados = telemetrias;
                response.Mensagem = $"{telemetrias.Count} telemetrias encontradas.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, $"Erro ao buscar telemetrias do condomínio {condominioId}");
            }

            return response;
        }

        public async Task<ResponseModel<TelemetriaStatsDTO>> GetEstatisticasSensorAsync(int sensorId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<TelemetriaStatsDTO>();

            try
            {
                var sensor = await _context.Sensores.FindAsync(sensorId);
                if (sensor == null)
                {
                    response.Status = false;
                    response.Mensagem = "Sensor não encontrado.";
                    return response;
                }

                var query = _context.Telemetrias
                    .Where(t => t.SensorId == sensorId);

                if (dataInicio.HasValue)
                    query = query.Where(t => t.Momento >= dataInicio.Value);

                if (dataFim.HasValue)
                    query = query.Where(t => t.Momento <= dataFim.Value);

                var telemetrias = await query.ToListAsync();

                var stats = new TelemetriaStatsDTO
                {
                    SensorId = sensorId,
                    NomeSensor = sensor.Nome,
                    TotalLeituras = telemetrias.Count,
                    MediaOcupacao = telemetrias.Any(t => t.NivelOcupacao.HasValue)
                        ? (decimal)telemetrias.Where(t => t.NivelOcupacao.HasValue).Average(t => t.NivelOcupacao!.Value)
                        : null,
                    MediaTemperatura = telemetrias.Any(t => t.Temperatura.HasValue)
                        ? telemetrias.Where(t => t.Temperatura.HasValue).Average(t => t.Temperatura!.Value)
                        : null,
                    NivelAtual = telemetrias.OrderByDescending(t => t.Momento).FirstOrDefault()?.NivelOcupacao,
                    UltimaLeitura = telemetrias.OrderByDescending(t => t.Momento).FirstOrDefault()?.Momento,
                    AlertasCheio = telemetrias.Count(t => t.NivelOcupacao >= 90)
                };

                response.Status = true;
                response.Dados = stats;
                response.Mensagem = "Estatísticas calculadas.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, $"Erro ao calcular estatísticas do sensor {sensorId}");
            }

            return response;
        }

        public async Task<ResponseModel<List<TelemetriaStatsDTO>>> GetEstatisticasCondominioAsync(int condominioId)
        {
            var response = new ResponseModel<List<TelemetriaStatsDTO>>();

            try
            {
                var sensores = await _context.Sensores
                    .Where(s => s.CondominioId == condominioId)
                    .ToListAsync();

                var statsList = new List<TelemetriaStatsDTO>();

                foreach (var sensor in sensores)
                {
                    var statsResponse = await GetEstatisticasSensorAsync(sensor.Id);
                    if (statsResponse.Status && statsResponse.Dados != null)
                    {
                        statsList.Add(statsResponse.Dados);
                    }
                }

                response.Status = true;
                response.Dados = statsList;
                response.Mensagem = $"Estatísticas de {statsList.Count} sensores.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, $"Erro ao calcular estatísticas do condomínio {condominioId}");
            }

            return response;
        }

        public async Task<ResponseModel<int>> DeleteTelemetriasAntigasAsync(DateTime dataLimite)
        {
            var response = new ResponseModel<int>();

            try
            {
                var telemetriasAntigas = await _context.Telemetrias
                    .Where(t => t.Momento < dataLimite)
                    .ToListAsync();

                var count = telemetriasAntigas.Count;

                _context.Telemetrias.RemoveRange(telemetriasAntigas);
                await _context.SaveChangesAsync();

                response.Status = true;
                response.Dados = count;
                response.Mensagem = $"{count} telemetrias antigas removidas.";

                _logger.LogInformation($"Limpeza: {count} telemetrias anteriores a {dataLimite:yyyy-MM-dd} removidas.");
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao deletar telemetrias antigas");
            }

            return response;
        }
    }
}
