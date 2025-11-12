using ApiEcoBin.Dto.ExpoTokens;
using ApiEcoBin.Models;
using ApiEcoBin.Services.ExpoTokens;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExpoTokensController : ControllerBase
    {
        private readonly IExpoTokensInterface _expoTokensService;

        public ExpoTokensController(IExpoTokensInterface expoTokensService)
        {
            _expoTokensService = expoTokensService;
        }

        [HttpPost("token")]
        public async Task<IActionResult> SalvarToken([FromBody] ExpoTokenCreateDTO dto)
        {
            var response = await _expoTokensService.SalvarTokenAsync(dto);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpGet("tokens/usuario/{usuarioId}")]
        public async Task<IActionResult> ListarTokensPorUsuario(int usuarioId)
        {
            var response = await _expoTokensService.ListarTokensPorUsuarioAsync(usuarioId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("token/{tokenId}")]
        public async Task<IActionResult> DesativarToken(int tokenId)
        {
            var response = await _expoTokensService.DesativarTokenAsync(tokenId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPost("notificacoes/enviar-todos")]
        public async Task<IActionResult> EnviarParaTodos([FromBody] NotificacaoCreateDTO dto)
        {
            var response = await _expoTokensService.EnviarNotificacaoParaTodosAsync(dto);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPost("notificacoes/enviar")]
        public async Task<IActionResult> EnviarParaUsuarios([FromBody] NotificacaoEnviarDTO dto)
        {
            var response = await _expoTokensService.EnviarNotificacaoParaUsuariosAsync(dto);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPost("notificacoes/enviar-usuario/{usuarioId}")]
        public async Task<IActionResult> EnviarParaUsuario(int usuarioId, [FromBody] NotificacaoCreateDTO dto)
        {
            var response = await _expoTokensService.EnviarNotificacaoParaUsuarioAsync(usuarioId, dto);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPost("notificacoes/enviar-condominio/{condominioId}")]
        public async Task<IActionResult> EnviarParaCondominio(int condominioId, [FromBody] NotificacaoCreateDTO dto)
        {
            var response = await _expoTokensService.EnviarNotificacaoParaCondominioAsync(condominioId, dto);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPost("notificacoes/enviar-condominio-tipo")]
        public async Task<IActionResult> EnviarParaCondominioTipo([FromBody] NotificacaoCondominioTipoDTO dto)
        {
            var response = await _expoTokensService.EnviarNotificacaoParaCondominioTipoAsync(dto);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpGet("notificacoes/usuario/{usuarioId}")]
        public async Task<IActionResult> ListarNotificacoesPorUsuario(int usuarioId)
        {
            var response = await _expoTokensService.ListarNotificacoesPorUsuarioAsync(usuarioId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpGet("notificacoes/usuario/{usuarioId}/nao-lidas")]
        public async Task<IActionResult> ListarNotificacoesNaoLidas(int usuarioId)
        {
            var response = await _expoTokensService.ListarNotificacoesNaoLidasAsync(usuarioId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPut("notificacoes/{notificacaoId}/marcar-lida")]
        public async Task<IActionResult> MarcarComoLida(int notificacaoId)
        {
            var response = await _expoTokensService.MarcarComoLidaAsync(notificacaoId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPut("notificacoes/usuario/{usuarioId}/marcar-todas-lidas")]
        public async Task<IActionResult> MarcarTodasComoLidas(int usuarioId)
        {
            var response = await _expoTokensService.MarcarTodasComoLidasAsync(usuarioId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("limpeza")]
        public async Task<IActionResult> DeleteNotificacoesAntigas([FromQuery] DateTime dataLimite)
        {
            var response = await _expoTokensService.DeletarNotificacoesAntigasAsync(dataLimite);
            return response.Status ? Ok(response) : BadRequest(response);
        }
    }
}