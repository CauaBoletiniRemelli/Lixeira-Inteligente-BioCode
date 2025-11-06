using ApiEcoBin.Dto.Provisionamentos;
using ApiEcoBin.Services.Condominio;
using ApiEcoBin.Services.Provisionamentos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProvisionamentosController(IProvisionamentosInteraface provService) : ControllerBase
    {
        private readonly IProvisionamentosInteraface _provService = provService;

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("criar")]
        public async Task<IActionResult> CriarProvisionamento([FromBody] ProvisionCreateRequestDTO dto)
        {
            var res = await _provService.CreateProvisionamentoAsync(dto);
            if (!res.Status) return BadRequest(res);
            return Ok(res);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpGet("gerar-qr/{provisionId}")]
        public async Task<IActionResult> GerarQrCode(int provisionId)
        {
            var res = await _provService.CreateQrCodeProvisionamentoAsync(provisionId);
            if (!res.Status) return BadRequest(res);
            return File(res.Dados!.QrBytes, res.Dados.MediaType);
        }

        [Authorize]
        [HttpPost("ativar-qr")]
        public async Task<IActionResult> AtivarQr([FromBody] ProvisionActivateRequestDTO dto)
        {
            int? userId = User.FindFirst("sub") != null ? int.Parse(User.FindFirst("sub")!.Value) : null;

            var res = await _provService.ActivateProvisionAsync(dto, userId);
            if (!res.Status) return BadRequest(res);
            return Ok(res);
        }

        [AllowAnonymous]
        [HttpPost("confirm-config/{deviceId}")]
        public async Task<IActionResult> ConfirmConfig(string deviceId, [FromBody] Dto.Devices.ConfirmConfigDTO dto)
        {
            var res = await _provService.ConfirmDeviceConfigAsync(deviceId, dto);
            if (!res.Status) return BadRequest(res);
            return Ok(res);
        }
    }
}
