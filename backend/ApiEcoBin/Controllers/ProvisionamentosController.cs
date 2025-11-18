using ApiEcoBin.Dto.Provisionamentos;
using ApiEcoBin.Services.Provisionamentos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProvisionamentosController(IProvisionamentosInteraface provService) : ControllerBase
    {
        private readonly IProvisionamentosInteraface _provService = provService;

        [Authorize(Policy = "AdminOnly")]
        [HttpGet]
        public async Task<IActionResult> GetProvisionamentos()
        {
            var res = await _provService.GetProvisionamentosAsync();
            if (!res.Status) return BadRequest(res);
            return Ok(res);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProvisionamentoById(int id)
        {
            var res = await _provService.GetProvisionamentoByIdAsync(id);
            if (!res.Status) return NotFound(res);
            return Ok(res);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("criar")]
        public async Task<IActionResult> CriarProvisionamento([FromBody] ProvisionCreateRequestDTO dto)
        {
            var res = await _provService.CreateProvisionamentoAsync(dto);
            if (!res.Status) return BadRequest(res);
            return Ok(res);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("criar-com-sensor")]
        public async Task<IActionResult> CriarProvisionamentoComSensor([FromBody] ProvisionCreateWithSensorDTO dto)
        {
            var res = await _provService.CreateProvisionamentoComSensorAsync(dto);
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

        /// <summary>
        /// Ativa o provisionamento (chamado pelo app). Deve gerar e retornar sessionToken.
        /// </summary>
        [Authorize]
        [HttpPost("ativar-qr")]
        public async Task<IActionResult> AtivarQr([FromBody] ProvisionActivateRequestDTO dto)
        {
            int? userId = User.FindFirst("sub") != null ? int.Parse(User.FindFirst("sub")!.Value) : null;

            var res = await _provService.ActivateProvisionAsync(dto, userId);
            if (!res.Status) return BadRequest(res);
            return Ok(res);
        }

        /// <summary>
        /// ASSIGN WIFI
        /// O app envia SSID/password vinculado ao sessionToken gerado pelo AtivarQr.
        /// Rota: POST /api/Provisionamentos/{sessionToken}/assign-wifi
        /// Requer autenticação do app (Policy pode ser "AppOnly" ou "Authorize")
        /// </summary>
        [Authorize(Policy = "AppOnly")]
        [HttpPost("{sessionToken}/assign-wifi")]
        public async Task<IActionResult> AssignWifi(string sessionToken, [FromBody] AssignWifiRequestDTO dto)
        {
            if (string.IsNullOrWhiteSpace(sessionToken))
                return BadRequest(new { status = false, mensagem = "sessionToken obrigatório" });

            var res = await _provService.AssignWifiToSessionAsync(sessionToken, dto);
            if (!res.Status) return BadRequest(res);
            return Ok(res);
        }

        /// <summary>
        /// GET WIFI CREDENTIALS (polling do dispositivo)
        /// Rota: GET /api/Provisionamentos/wifi-credentials/{deviceId}?sessionToken=...
        /// AllowAnonymous para que ESPs sem JWT possam poll (validação é feita com sessionToken + deviceId)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("wifi-credentials/{deviceId}")]
        public async Task<IActionResult> GetWifiCredentials(string deviceId, [FromQuery] string sessionToken)
        {
            if (string.IsNullOrEmpty(deviceId) || string.IsNullOrEmpty(sessionToken))
                return BadRequest(new { status = false, mensagem = "deviceId e sessionToken são obrigatórios" });

            var res = await _provService.GetWifiCredentialsAsync(deviceId, sessionToken);
            if (!res.Status) return NotFound(res);
            return Ok(res);
        }

        /// <summary>
        /// ConfirmConfig (o ESP chama após conectar ao WiFi)
        /// Rota já existente: POST /api/Provisionamentos/confirm-config/{deviceId}
        /// </summary>
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
