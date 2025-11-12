using ApiEcoBin.Dto.Devices;
using ApiEcoBin.Services.Provisionamentos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevicesController(IProvisionamentosInteraface provService) : ControllerBase
    {
        private readonly IProvisionamentosInteraface _provService = provService;

        [AllowAnonymous]
        [HttpGet("{deviceId}/wifi-credentials")]
        public async Task<IActionResult> GetWifiCredentials(string deviceId, [FromQuery] string sessionToken)
        {
            if (string.IsNullOrWhiteSpace(sessionToken))
                return BadRequest(new { message = "sessionToken é obrigatório" });

            var res = await _provService.GetWifiCredentialsAsync(deviceId, sessionToken);

            if (!res.Status)
                return Unauthorized(res);

            return Ok(res);
        }

        [AllowAnonymous] 
        [HttpPost("{deviceId}/confirm-config")]
        public async Task<IActionResult> ConfirmConfig(string deviceId, [FromBody] ConfirmConfigDTO dto)
        {
            var res = await _provService.ConfirmDeviceConfigAsync(deviceId, dto);

            if (!res.Status) 
                return BadRequest(res); 
                
            return Ok(res);
        }
    }
}
