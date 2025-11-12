using ApiEcoBin.Dto.Telemetrias;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Telemetrias;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class TelemetriasController : ControllerBase
    {
        private readonly ITelemetriasInterface _telemetrias;
        private readonly ILogger<TelemetriasController> _logger;

        public TelemetriasController(ITelemetriasInterface telemetrias, ILogger<TelemetriasController> logger)
        {
            _telemetrias = telemetrias;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTelemetria([FromBody] TelemetriaCreateDTO dto)
        {
            _logger.LogInformation($"Recebendo telemetria do sensor {dto.SensorId}");

            var response = await _telemetrias.CreateTelemetriaAsync(dto);

            if (response.Status)
            {
                return Ok(response);
            }

            return BadRequest(response);
        }

        [HttpPost("arduino")]
        public async Task<IActionResult> CreateTelemetriaArduino([FromBody] TelemetriaArduinoDTO dto)
        {
            _logger.LogInformation($"Recebendo telemetria Arduino do sensor {dto.SensorId}");

            var response = await _telemetrias.CreateTelemetriaArduinoAsync(dto);

            if (response.Status)
            {
                return Ok(response);
            }

            return BadRequest(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetTelemetrias()
        {
            var response = await _telemetrias.GetTelemetriasAsync();
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpPost("filtrar")]
        public async Task<IActionResult> GetTelemetriasFiltro([FromBody] TelemetriaFiltroDTO filtro)
        {
            var response = await _telemetrias.GetTelemetriasFiltroAsync(filtro);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpGet("sensor/{sensorId}")]
        public async Task<IActionResult> GetTelemetriasBySensor(int sensorId, [FromQuery] int limit = 100)
        {
            var response = await _telemetrias.GetTelemetriasBySensorAsync(sensorId, limit);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpGet("sensor/{sensorId}/ultima")]
        public async Task<IActionResult> GetUltimaTelemetria(int sensorId)
        {
            var response = await _telemetrias.GetUltimaTelemetriaAsync(sensorId);
            return response.Status ? Ok(response) : NotFound(response);
        }

        [HttpGet("condominio/{condominioId}")]
        public async Task<IActionResult> GetTelemetriasByCondominio(int condominioId)
        {
            var response = await _telemetrias.GetTelemetriasByCondominioAsync(condominioId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpGet("sensor/{sensorId}/estatisticas")]
        public async Task<IActionResult> GetEstatisticasSensor(
            int sensorId,
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null)
        {
            var response = await _telemetrias.GetEstatisticasSensorAsync(sensorId, dataInicio, dataFim);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpGet("condominio/{condominioId}/estatisticas")]
        public async Task<IActionResult> GetEstatisticasCondominio(int condominioId)
        {
            var response = await _telemetrias.GetEstatisticasCondominioAsync(condominioId);
            return response.Status ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("limpeza")]
        public async Task<IActionResult> DeleteTelemetriasAntigas([FromQuery] DateTime dataLimite)
        {
            var response = await _telemetrias.DeleteTelemetriasAntigasAsync(dataLimite);
            return response.Status ? Ok(response) : BadRequest(response);
        }
    }
}