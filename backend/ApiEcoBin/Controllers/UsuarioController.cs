using ApiEcoBin.Models;
using ApiEcoBin.Services.Usuario;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ApiEcoBin.Requests;
using Microsoft.AspNetCore.Authorization;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        #region Propriedades
        private readonly IUsuarioInterface _usuarioInterface;
        #endregion

        #region Construtores
        public UsuarioController(IUsuarioInterface usuarioInterface)
        {
            _usuarioInterface = usuarioInterface;
        }
        #endregion


        [HttpPost("CriarUsuario")]
        public async Task<ActionResult<ResponseModel<UsuarioModel>>> CreateUser([FromBody] CreateUsuarioRequest request)
        {
            var usuario = new UsuarioModel
            {
                Nome = request.Nome ?? string.Empty,
                Email = request.Email ?? string.Empty,
                Tipo = request.Tipo
            };
            
            ResponseModel<UsuarioModel> response = await _usuarioInterface.CreateUser(usuario, request.Senha!);
            
            if (response.Status)
            {
                return Ok(response);
            }
            
            return BadRequest(response);
        }

        [Authorize]
        [HttpGet("ListarUsuarios")]
        public async Task<ActionResult<ResponseModel<List<UsuarioModel>>>> GetUsers()
        {
            ResponseModel<List<UsuarioModel>> response = await _usuarioInterface.GetUsers();

            if (response.Status)
            {
                return Ok(response);
            }

            return BadRequest(response);
        }

        [Authorize]
        [HttpGet("BuscarUsuarioPorId/{idUser}")]
        public async Task<ActionResult<ResponseModel<UsuarioModel>>>  GetUserById(int idUser)
        {
            ResponseModel<UsuarioModel> response = await _usuarioInterface.GetUserById(idUser);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
    }
}
