using ApiEcoBin.Models;
using ApiEcoBin.Requests;
using ApiEcoBin.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        #region Propriedades
        private readonly IAuthInterface _authInterface;
        #endregion

        #region Construtores
        public AuthController(IAuthInterface authInterface)
        {
            _authInterface = authInterface;
        }
        #endregion

        [HttpPost("AppLogin")]
        public async Task<ActionResult<ResponseModel<AuthModel>>> AppLogin([FromBody] AppLoginRequest request)
        {
            ResponseModel<AuthModel> response = await _authInterface.AppLogin(request);
            if (response.Status)
            {
                return Ok(response);
            }
            return Unauthorized(response);
        }

        [Authorize(Policy = "AppOnly")]
        [HttpPost("Login")]
        public async Task<ActionResult<ResponseModel<AuthModel>>> Auth([FromBody] LoginRequest request)
        {
            ResponseModel<AuthModel> response = await _authInterface.Login(request);
            if (response.Status)
            {
                return Ok(response);
            }
            return Unauthorized(response);
        }

        [HttpPost("RefreshToken")]
        [AllowAnonymous]
        public async Task<ActionResult<ResponseModel<AuthModel>>> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            ResponseModel<AuthModel> response = await _authInterface.RefreshToken(request);
            if (response.Status)
            {
                return Ok(response);
            }
            return Unauthorized(response);
        }

        [HttpPost("Logout")]
        [AllowAnonymous]
        public async Task<ActionResult<ResponseModel<object>>> Logout([FromBody] RefreshTokenRequest request)
        {
            ResponseModel<object> response = await _authInterface.Logout(request);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [Authorize(Policy = "AppOnly")]
        [HttpPost("forgot-password")]
        public async Task<ActionResult<ResponseModel<UsuariosModel>>> ForgotMyPassword(string usuEmail)
        {
            ResponseModel<UsuariosModel> response = await _authInterface.ForgotPassword(usuEmail);
            if (response.Status)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
    }
}