using ApiEcoBin.Dto.Dashboard;
using ApiEcoBin.Services.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class DashboardController(IDashboardInterface dashboardService) : ControllerBase
    {
        private readonly IDashboardInterface _dashboard = dashboardService;

        [HttpGet("condominio/{condominioId}")]
        public async Task<IActionResult> GetDashboardGeral(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetDashboardGeralAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/nivel-tempo")]
        public async Task<IActionResult> GetNivelAoLongoDoTempo(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null, [FromQuery] GranularidadePeriodo granularidade = GranularidadePeriodo.Dia)
        {
            var res = await _dashboard.GetNivelAoLongoDoTempoAsync(condominioId, dataInicio, dataFim, granularidade);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/reciclavel")]
        public async Task<IActionResult> GetVolumeReciclavel(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetVolumeReciclavelAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/ranking")]
        public async Task<IActionResult> GetRankingLixeiras(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetRankingLixeirasAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/evolucao-mensal")]
        public async Task<IActionResult> GetEvolucaoMensal(int condominioId, [FromQuery] int meses = 6)
        {
            var res = await _dashboard.GetEvolucaoMensalAsync(condominioId, meses);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/eficiencia-coleta")]
        public async Task<IActionResult> GetEficienciaColeta(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetEficienciaColetaAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/tempo-enchimento")]
        public async Task<IActionResult> GetTempoMedioEnchimento(int condominioId)
        {
            var res = await _dashboard.GetTempoMedioEnchimentoAsync(condominioId);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/alertas")]
        public async Task<IActionResult> GetAlertasOcorrencias(int condominioId)
        {
            var res = await _dashboard.GetAlertasOcorrenciasAsync(condominioId);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/impacto-ambiental")]
        public async Task<IActionResult> GetImpactoAmbiental(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetImpactoAmbientalAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/uso-dia-semana")]
        public async Task<IActionResult> GetUsoPorDiaSemana(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetUsoPorDiaSemanaAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/economia")]
        public async Task<IActionResult> GetEconomiaEstimada(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null, [FromQuery] decimal custoMedioColeta = 150m)
        {
            var res = await _dashboard.GetEconomiaEstimadaAsync(condominioId, dataInicio, dataFim, custoMedioColeta);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/coletor")]
        public async Task<IActionResult> GetPainelColetor(int condominioId)
        {
            var res = await _dashboard.GetPainelColetorAsync(condominioId);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/energia-solar")]
        public async Task<IActionResult> GetEnergiaSolar(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetEnergiaSolarAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}/oleo")]
        public async Task<IActionResult> GetOleoResumo(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _dashboard.GetOleoResumoAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }
    }
}
