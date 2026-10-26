using ApiEcoBin.Data;
using ApiEcoBin.Dto.OleoColetas;
using ApiEcoBin.Enums;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Services.OleoColetas
{
    public class OleoColetasService(AppDbContext context, ILogger<OleoColetasService> logger) : IOleoColetasInterface
    {
        private readonly AppDbContext _context = context;
        private readonly ILogger<OleoColetasService> _logger = logger;

        public async Task<ResponseModel<OleoColetaDTO>> CreateAsync(OleoColetaCreateDTO dto, int? usuarioId)
        {
            var response = new ResponseModel<OleoColetaDTO>();
            try
            {
                if (!await _context.Condominios.AnyAsync(c => c.Id == dto.CondominioId))
                {
                    response.Status = false;
                    response.Mensagem = "Condomínio não encontrado.";
                    return response;
                }

                if (dto.SensorId.HasValue)
                {
                    var sensor = await _context.Sensores.FindAsync(dto.SensorId.Value);
                    if (sensor == null || sensor.CondominioId != dto.CondominioId || sensor.Tipo != TipoLixeira.Oleo)
                    {
                        response.Status = false;
                        response.Mensagem = "Recipiente de óleo não encontrado neste condomínio.";
                        return response;
                    }
                }

                var coleta = new OleoColetasModel
                {
                    CondominioId = dto.CondominioId,
                    SensorId = dto.SensorId,
                    UsuarioId = usuarioId,
                    Litros = Math.Round(dto.Litros, 2),
                    Destino = dto.Destino?.Trim(),
                    Observacao = dto.Observacao?.Trim(),
                    DataColeta = dto.DataColeta ?? DateTime.UtcNow,
                    CriadoEm = DateTime.UtcNow
                };

                _context.OleoColetas.Add(coleta);
                await _context.SaveChangesAsync();

                response.Status = true;
                response.Mensagem = "Coleta de óleo registrada com sucesso.";
                response.Dados = (await QueryDTO().FirstAsync(c => c.Id == coleta.Id));
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro ao registrar coleta de oleo"); }
            return response;
        }

        public async Task<ResponseModel<List<OleoColetaDTO>>> GetByCondominioAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var response = new ResponseModel<List<OleoColetaDTO>>();
            try
            {
                var query = QueryDTO().Where(c => c.CondominioId == condominioId);
                if (dataInicio.HasValue) query = query.Where(c => c.DataColeta >= dataInicio.Value);
                if (dataFim.HasValue) query = query.Where(c => c.DataColeta <= dataFim.Value);

                var coletas = await query.OrderByDescending(c => c.DataColeta).ToListAsync();

                response.Status = true;
                response.Dados = coletas;
                response.Mensagem = $"{coletas.Count} coletas de óleo encontradas.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro ao listar coletas de oleo"); }
            return response;
        }

        public async Task<ResponseModel<bool>> DeleteAsync(int id)
        {
            var response = new ResponseModel<bool>();
            try
            {
                var coleta = await _context.OleoColetas.FindAsync(id);
                if (coleta == null)
                {
                    response.Status = false;
                    response.Mensagem = "Coleta não encontrada.";
                    return response;
                }

                _context.OleoColetas.Remove(coleta);
                await _context.SaveChangesAsync();

                response.Status = true;
                response.Dados = true;
                response.Mensagem = "Coleta removida.";
            }
            catch (Exception ex) { response.Status = false; response.Mensagem = ex.Message; _logger.LogError(ex, "Erro ao remover coleta de oleo"); }
            return response;
        }

        private IQueryable<OleoColetaDTO> QueryDTO() =>
            _context.OleoColetas.Select(c => new OleoColetaDTO
            {
                Id = c.Id,
                CondominioId = c.CondominioId,
                SensorId = c.SensorId,
                NomeSensor = c.Sensor != null ? c.Sensor.Nome : null,
                Litros = c.Litros,
                Destino = c.Destino,
                Observacao = c.Observacao,
                DataColeta = c.DataColeta,
                RegistradoPor = c.Usuario != null ? c.Usuario.Nome : null
            });
    }
}
