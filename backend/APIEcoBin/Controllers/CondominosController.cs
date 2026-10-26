using ApiEcoBin.Services.Condominos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Policy = "ProprietarioOrAbove")]
    [ApiController]
    public class CondominosController(ICondominosInterface condominosService) : ControllerBase
    {
        private readonly ICondominosInterface _service = condominosService;

        private int? CondominioIdDoToken =>
            int.TryParse(User.FindFirst("condominioId")?.Value, out var id) ? id : null;

        private int? ResolverCondominioId(int? queryParam) =>
            queryParam.HasValue ? queryParam : CondominioIdDoToken;

        [HttpGet("home")]
        public async Task<IActionResult> GetHome([FromQuery] int? condominioId = null)
        {
            var id = ResolverCondominioId(condominioId);
            if (id == null) return BadRequest(new { status = false, mensagem = "condominioId nao encontrado no token." });
            var res = await _service.GetHomeAsync(id.Value);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("lixeiras")]
        public async Task<IActionResult> GetStatusLixeiras([FromQuery] int? condominioId = null)
        {
            var id = ResolverCondominioId(condominioId);
            if (id == null) return BadRequest(new { status = false, mensagem = "condominioId nao encontrado no token." });
            var res = await _service.GetStatusLixeirasAsync(id.Value);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("impacto")]
        public async Task<IActionResult> GetImpactoMes([FromQuery] int? condominioId = null)
        {
            var id = ResolverCondominioId(condominioId);
            if (id == null) return BadRequest(new { status = false, mensagem = "condominioId nao encontrado no token." });
            var res = await _service.GetImpactoMesAsync(id.Value);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("coletas")]
        public async Task<IActionResult> GetUltimasColetas([FromQuery] int? condominioId = null, [FromQuery] int limite = 10)
        {
            var id = ResolverCondominioId(condominioId);
            if (id == null) return BadRequest(new { status = false, mensagem = "condominioId nao encontrado no token." });
            var res = await _service.GetUltimasColetasAsync(id.Value, limite);
            return res.Status ? Ok(res) : BadRequest(res);
        }
    }
}
