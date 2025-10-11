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
        [HttpGet("condominios")]
        public async Task<ActionResult<ResponseModel<List<CondominiosModel>>>> GetCondominios()
        {
            ResponseModel<List<CondominiosModel>> response = await _condominioInterface.GetCondominios();
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [Authorize]
        [HttpPost("condominios")]
        public async Task<ActionResult<ResponseModel<CondominiosModel>>> PostCondominio([FromBody] CondominiosModel condominio)
        {
            ResponseModel<CondominiosModel> response = await _condominioInterface.PostCondominio(condominio);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
    }
}
