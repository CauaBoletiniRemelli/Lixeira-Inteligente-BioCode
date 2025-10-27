using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Condominio;
using ApiEcoBin.Services.Sensores;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SensoresController : ControllerBase
    {
        #region Propriedades
        private readonly ISensoresInterface _sensoresInterface;
        #endregion

        #region Construtores
        public SensoresController(ISensoresInterface sensoresInterface)
        {
            _sensoresInterface = sensoresInterface;
        }
        #endregion

        [Authorize(Policy = "AdminOnly")]
        [HttpGet]
        public async Task<ActionResult<List<SensoresModel>>> GetSensores()
        {
            ResponseModel<List<SensoresModel>> response = await _sensoresInterface.GetSensores();
            if (response.Status)
                return Ok(response);
            return BadRequest(response);
        }

        [Authorize(Policy="AdminOnly")]
        [HttpPost]
        public async Task<ActionResult<SensoresModel>> PostSensores(SensorCreateDTO sensorCreateDTO)
        {
            ResponseModel<SensoresModel> response = await _sensoresInterface.CreateSensor(sensorCreateDTO);

            if (response.Status)
                return Ok(response);

            return BadRequest(response);
        }


        [Authorize(Policy = "AdminOnly")]
        [HttpPut]
        public async Task<ActionResult<SensoresModel>> PutSensores(SensorEditDTO sensorEditDTO)
        {
            ResponseModel<SensoresModel> response = await _sensoresInterface.UpdateSensor(sensorEditDTO);
            if (response.Status)
                return Ok(response);
            return BadRequest(response);
        }

        [Authorize(Policy="AdminOnly")]
        [HttpDelete("{idSensor}")]
        public async Task<ActionResult<List<SensoresModel>>> DeleteSensores(int idSensor)
        {
            ResponseModel<List<SensoresModel>> response = await _sensoresInterface.DeleteSensor(idSensor);
            if (response.Status)
                return Ok(response);
            return BadRequest(response);
        }

    }
}
