using ApiEcoBin.Models;
using ApiEcoBin.Services.Usuario;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ApiEcoBin.Requests;
using Microsoft.AspNetCore.Authorization;
using ApiEcoBin.Dto.Usuarios;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        #region Propriedades
        private readonly IUsuarioInterface _usuarioInterface;
        #endregion

        #region Construtores
        public UsuariosController(IUsuarioInterface usuarioInterface)
        {
            _usuarioInterface = usuarioInterface;
        }
        #endregion

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<ResponseModel<List<UsuariosModel>>>> GetUsers()
        {
            ResponseModel<List<UsuariosModel>> response = await _usuarioInterface.GetUsers();

            if (response.Status)
            {
                return Ok(response);
            }

            return BadRequest(response);
        }

        [Authorize]
        [HttpGet("{idUser}")]
        public async Task<ActionResult<ResponseModel<UsuariosModel>>>  GetUserById(int idUser)
        {
            ResponseModel<UsuariosModel> response = await _usuarioInterface.GetUserById(idUser);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [Authorize(Policy = "AppOnly")]
        [HttpPost]
        public async Task<ActionResult<ResponseModel<UserCreateDTO>>> CreateUser([FromBody] UserCreateDTO userCreateDTO)
        {

            ResponseModel<UsuariosModel> response = await _usuarioInterface.CreateUser(userCreateDTO);

            if (response.Status)
            {
                return Ok(response);
            }

            return BadRequest(response);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut]
        public async Task<ActionResult<ResponseModel<UsuariosModel>>> UpdateUser([FromBody] UserEditDTO userEditDTO)
        {
            ResponseModel<UsuariosModel> response = await _usuarioInterface.UpdateUser(userEditDTO);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete("{idUser}")]
        public async Task<ActionResult<ResponseModel<List<UsuariosModel>>>> DeleteUser(int idUser)
        {
            ResponseModel<List<UsuariosModel>> response = await _usuarioInterface.DeleteUser(idUser);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
    }
}
