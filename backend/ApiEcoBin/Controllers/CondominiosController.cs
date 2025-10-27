using ApiEcoBin.Dto.Condominios;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Condominio;
using ApiEcoBin.Services.Usuario;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CondominiosController : ControllerBase
    {
        #region Propriedades
        private readonly ICondominioInterface _condominioInterface;
        #endregion

        #region Construtores
        public CondominiosController(ICondominioInterface condominioInterface)
        {
            _condominioInterface = condominioInterface;
        }
        #endregion

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<ResponseModel<List<CondominiosModel>>>> GetCondominios()
        {
            ResponseModel<List<CondominiosModel>> response = await _condominioInterface.GetCondominios();
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost]
        public async Task<ActionResult<ResponseModel<CondominiosModel>>> PostCondominio([FromBody] CondominiosCreateDTO condominio)
        {
            ResponseModel<CondominiosModel> response = await _condominioInterface.CreateCondominio(condominio);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut]
        public async Task<ActionResult<ResponseModel<CondominiosModel>>> UpdateCondominio([FromBody] CondominioEditDTO condominio)
        {
            ResponseModel<CondominiosModel> response = await _condominioInterface.UpdateCondominio(condominio);

            if (response.Status)
            {
                return Ok(response);
            }

            return BadRequest(response);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete]
        public async Task<ActionResult<ResponseModel<List<CondominiosModel>>>> DeleteCondominio(int idCond)
        {
            ResponseModel<List<CondominiosModel>> response = await _condominioInterface.DeleteCondominio(idCond);

            if (response.Status)
            {
                return Ok(response);
            }

            return BadRequest(response);
        }
    }
}
