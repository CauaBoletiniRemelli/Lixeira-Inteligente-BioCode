using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Sensores;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SensoresController : ControllerBase
    {
        private readonly ISensoresInterface _sensores;

        public SensoresController(ISensoresInterface sensores)
        {
            _sensores = sensores;
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpGet]
        public async Task<IActionResult> GetSensores()
        {
            var response = await _sensores.GetSensoresAsync();
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [Authorize]
        [HttpGet("{idCondominio}")]
        public async Task<IActionResult> GetSensoresByCondominio(int idCondominio)
        {
            var response = await _sensores.GetSensoresByCondominioAsync(idCondominio);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut]
        public async Task<IActionResult> UpdateSensor([FromBody] SensorEditDTO dto)
        {
            var response = await _sensores.UpdateSensorAsync(dto);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete("{idSensor}")]
        public async Task<IActionResult> DeleteSensor(int idSensor)
        {
            var response = await _sensores.DeleteSensorAsync(idSensor);
            return response.Status ? Ok(response) : BadRequest(response);
        }
    }
}
