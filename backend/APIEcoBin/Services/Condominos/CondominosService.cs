using ApiEcoBin.Data;
using ApiEcoBin.Dto.Condominos;
using ApiEcoBin.Enums;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Services.Condominos
{
    public class CondominosService(AppDbContext context, ILogger<CondominosService> logger) : ICondominosInterface
    {
        private readonly AppDbContext _context = context;
        private readonly ILogger<CondominosService> _logger = logger;

        private const int LimiarLotada = 90;
        private const int LimiarEnchendo = 60;
        private const decimal KgPorLeituraReciclavel = 2m;
        private const decimal Co2PorKg = 1.5m;
        private const decimal ArvoresPor100Kg = 1m;

        private static bool EhReciclavel(TipoLixeira tipo) => tipo is TipoLixeira.Reciclavel or TipoLixeira.Papel or TipoLixeira.Plastico or TipoLixeira.Metal or TipoLixeira.Vidro;

        public async Task<ResponseModel<List<StatusLixeiraDTO>>> GetStatusLixeirasAsync(int condominioId)
        {
            var response = new ResponseModel<List<StatusLixeiraDTO>>();
            try
            {
                var sensores = await _context.Sensores
                    .Where(s => s.CondominioId == condominioId)
                    .ToListAsync();

                var ultimasTelemetrias = await _context.Telemetrias
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.NivelOcupacao.HasValue)
                    .GroupBy(t => t.SensorId)
                    .Select(g => g.OrderByDescending(t => t.Momento).First())
                    .ToListAsync();

                var resultado = sensores.Select(s =>
                {
                    var ultima = ultimasTelemetrias.FirstOrDefault(t => t.SensorId == s.Id);
                    int nivel = ultima?.NivelOcupacao ?? 0;
                    string cor = nivel >= LimiarLotada ? "vermelho" : nivel >= LimiarEnchendo ? "amarelo" : "verde";
                    string label = nivel >= LimiarLotada ? "Lotada" : nivel >= LimiarEnchendo ? "Enchendo" : "Livre";
                    return new StatusLixeiraDTO
                    {
                        SensorId = s.Id,
                        Nome = s.Nome ?? $"Lixeira {s.Id}",
                        TipoLixeira = s.Tipo.ToString(),
                        NivelOcupacao = nivel,
                        StatusCor = cor,
                        StatusLabel = label,
                        Latitude = s.Latitude,
                        Longitude = s.Longitude,
                        UltimaLeitura = ultima?.Momento
                    };
                }).ToList();

                response.Status = true;
                response.Dados = resultado;
                response.Mensagem = "Status das lixeiras retornado.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao buscar status das lixeiras");
            }
            return response;
        }

        public async Task<ResponseModel<ImpactoCondominoDTO>> GetImpactoMesAsync(int condominioId)
        {
            var response = new ResponseModel<ImpactoCondominoDTO>();
            try
            {
                var hoje = DateTime.UtcNow;
                var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);

                var telemetrias = await _context.Telemetrias
                    .Include(t => t.Sensor)
                    .Where(t => t.Sensor!.CondominioId == condominioId && t.Momento >= inicioMes && t.NivelOcupacao.HasValue)
                    .ToListAsync();

                int leiturasReciclaveis = telemetrias.Count(t => t.Sensor != null && EhReciclavel(t.Sensor.Tipo));
                decimal kgReciclados = leiturasReciclaveis * KgPorLeituraReciclavel;

                response.Status = true;
                response.Dados = new ImpactoCondominoDTO
                {
                    KgReciclados = kgReciclados,
                    Co2Evitado = Math.Round(kgReciclados * Co2PorKg, 2),
                    ArvoresSalvas = Math.Round(kgReciclados / 100 * ArvoresPor100Kg, 2),
                    Periodo = $"{inicioMes:dd/MM/yyyy} - {hoje:dd/MM/yyyy}"
                };
                response.Mensagem = "Impacto do mes calculado.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao calcular impacto do mes");
            }
            return response;
        }

        public async Task<ResponseModel<List<UltimaColetaDTO>>> GetUltimasColetasAsync(int condominioId, int limite = 10)
        {
            var response = new ResponseModel<List<UltimaColetaDTO>>();
            try
            {
                var sensores = await _context.Sensores.Where(s => s.CondominioId == condominioId).ToListAsync();
                var coletas = new List<UltimaColetaDTO>();

                foreach (var sensor in sensores)
                {
                    var leituras = await _context.Telemetrias
                        .Where(t => t.SensorId == sensor.Id && t.NivelOcupacao.HasValue)
                        .OrderBy(t => t.Momento)
                        .Select(t => new { t.NivelOcupacao, t.Momento })
                        .ToListAsync();

                    bool estavaCheio = false;
                    foreach (var l in leituras)
                    {
                        if (l.NivelOcupacao >= 90) estavaCheio = true;
                        if (estavaCheio && l.NivelOcupacao <= 20)
                        {
                            coletas.Add(new UltimaColetaDTO
                            {
                                SensorId = sensor.Id,
                                NomeSensor = sensor.Nome ?? $"Lixeira {sensor.Id}",
                                DataColeta = l.Momento
                            });
                            estavaCheio = false;
                        }
                    }
                }

                response.Status = true;
                response.Dados = coletas.OrderByDescending(c => c.DataColeta).Take(limite).ToList();
                response.Mensagem = "Ultimas coletas retornadas.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao buscar ultimas coletas");
            }
            return response;
        }

        public async Task<ResponseModel<HomeCondominoDTO>> GetHomeAsync(int condominioId)
        {
            var response = new ResponseModel<HomeCondominoDTO>();
            try
            {
                var lixeiras = await GetStatusLixeirasAsync(condominioId);
                var impacto = await GetImpactoMesAsync(condominioId);
                var coletas = await GetUltimasColetasAsync(condominioId);

                response.Status = true;
                response.Dados = new HomeCondominoDTO
                {
                    Lixeiras = lixeiras.Dados ?? [],
                    ImpactoMes = impacto.Dados ?? new(),
                    UltimasColetas = coletas.Dados ?? []
                };
                response.Mensagem = "Home do condomino carregada.";
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao carregar home do condomino");
            }
            return response;
        }
    }
}
