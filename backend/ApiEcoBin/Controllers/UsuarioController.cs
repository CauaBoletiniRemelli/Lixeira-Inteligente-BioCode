using ApiEcoBin.Models;
using ApiEcoBin.Services.Usuario;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioInterface _usuarioInterface;
        public UsuarioController(IUsuarioInterface usuarioInterface)
        {
            _usuarioInterface = usuarioInterface;
        }

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

        [HttpGet("ListarUsuarioPorId/{idUsuario}")]
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
