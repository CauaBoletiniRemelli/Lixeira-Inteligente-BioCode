using ApiEcoBin.Dto.OleoColetas;
using ApiEcoBin.Services.OleoColetas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class OleoColetasController(IOleoColetasInterface oleoColetasService) : ControllerBase
    {
        private readonly IOleoColetasInterface _service = oleoColetasService;

        private int? UsuarioIdDoToken =>
            int.TryParse(User.FindFirst("userId")?.Value, out var id) ? id : null;

        [HttpPost]
        [Authorize(Policy = "ColetorOrAbove")]
        public async Task<IActionResult> Create([FromBody] OleoColetaCreateDTO dto)
        {
            var res = await _service.CreateAsync(dto, UsuarioIdDoToken);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpGet("condominio/{condominioId}")]
        public async Task<IActionResult> GetByCondominio(int condominioId, [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var res = await _service.GetByCondominioAsync(condominioId, dataInicio, dataFim);
            return res.Status ? Ok(res) : BadRequest(res);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(int id)
        {
            var res = await _service.DeleteAsync(id);
            return res.Status ? Ok(res) : BadRequest(res);
        }
    }
}
