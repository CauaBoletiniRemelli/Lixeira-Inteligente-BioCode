using ApiEcoBin.Data;
using ApiEcoBin.Models;
using ApiEcoBin.Services;
using ApiEcoBin.Services.PasswordHash;
using ApiEcoBin.Requests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiEcoBin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHashService _passwordHashService;
        private readonly TokenService _tokenService;

        public AuthController(AppDbContext context, IPasswordHashService passwordHashService, TokenService tokenService)
        {
            _context = context;
            _passwordHashService = passwordHashService;
            _tokenService = tokenService;
        }

        [HttpPost("Login")]
        public async Task<ActionResult<ResponseModel<AuthModel>>> Auth([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest(new ResponseModel<AuthModel>
                    {
                        Dados = null,
                        Mensagem = "Email e senha são obrigatórios.",
                        Status = false
                    });
                }

                UsuariosModel? usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (usuario == null || string.IsNullOrEmpty(usuario.SenhaHash) || !_passwordHashService.VerifyPassword(request.Password, usuario.SenhaHash))
                {
                    return Unauthorized(new ResponseModel<AuthModel>
                    {
                        Dados = null,
                        Mensagem = "E-mail ou senha incorretos.",
                        Status = false
                    });
                }

                object token = TokenService.GenerateToken(usuario);
                string refreshToken = TokenService.GenerateRefreshToken();

                RefreshTokensModel refreshTokenModel = new RefreshTokensModel
                {
                    UsuarioId = usuario.Id,
                    Token = refreshToken,
                    Expiracao = DateTime.UtcNow.AddDays(7),
                    Usuario = usuario
                };

                _context.RefreshTokens.Add(refreshTokenModel);
                await _context.SaveChangesAsync();

                CondominiosModel? condominio = await _context.Condominios.FirstOrDefaultAsync(c => c.Id == usuario.CondominioId);

                return Ok(new ResponseModel<AuthModel>
                {
                    Dados = new AuthModel
                    {
                        Token = token,
                        RefreshToken = refreshToken,
                        UserId = usuario.Id,
                        Email = usuario.Email,
                        Nome = usuario.Nome,
                        Tipo = usuario.Tipo,
                        CondominioId = usuario.CondominioId,
                        NomeCondominio = condominio?.Nome
                    },
                    Mensagem = "Login realizado com sucesso!",
                    Status = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseModel<AuthModel>
                {
                    Dados = null,
                    Mensagem = ex.Message,
                    Status = false
                });
            }
        }

        [HttpPost("RefreshToken")]
        public async Task<ActionResult<ResponseModel<AuthModel>>> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrEmpty(request.AccessToken) || string.IsNullOrEmpty(request.RefreshToken))
            {
                return BadRequest(new ResponseModel<AuthModel>
                {
                    Dados = null,
                    Mensagem = "Token inválido.",
                    Status = false
                });
            }

            try
            {
                ClaimsPrincipal? principal = TokenService.GetPrincipalFromExpiredToken(request.AccessToken);
                if (principal == null)
                {
                    return Unauthorized(new ResponseModel<AuthModel>
                    {
                        Dados = null,
                        Mensagem = "Token inválido.",
                        Status = false
                    });
                }

                string? userIdClaim = principal.FindFirst("userId")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new ResponseModel<AuthModel>
                    {
                        Dados = null,
                        Mensagem = "Token inválido.",
                        Status = false
                    });
                }

                int userId = int.Parse(userIdClaim);

                RefreshTokensModel? storedRefreshToken = await _context.RefreshTokens
                    .Include(rt => rt.Usuario)
                    .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken && rt.UsuarioId == userId);

                if (storedRefreshToken == null || storedRefreshToken.Revogado || storedRefreshToken.Expiracao < DateTime.UtcNow)
                {
                    return Unauthorized(new ResponseModel<AuthModel>
                    {
                        Dados = null,
                        Mensagem = "Refresh token inválido ou expirado.",
                        Status = false
                    });
                }

                object newAccessToken = TokenService.GenerateToken(storedRefreshToken.Usuario);
                string newRefreshToken = TokenService.GenerateRefreshToken();

                storedRefreshToken.Revogado = true;

                RefreshTokensModel newRefreshTokenModel = new RefreshTokensModel
                {
                    UsuarioId = userId,
                    Token = newRefreshToken,
                    Expiracao = DateTime.UtcNow.AddDays(7),
                    Usuario = storedRefreshToken.Usuario
                };

                _context.RefreshTokens.Add(newRefreshTokenModel);
                await _context.SaveChangesAsync();

                return Ok(new ResponseModel<AuthModel>
                {
                    Dados = new AuthModel
                    {
                        Token = newAccessToken,
                        RefreshToken = newRefreshToken,
                        UserId = storedRefreshToken.Usuario.Id,
                        Email = storedRefreshToken.Usuario.Email,
                        Nome = storedRefreshToken.Usuario.Nome
                    },
                    Mensagem = "Token renovado com sucesso!",
                    Status = true
                });
            }
            catch (Exception)
            {
                return Unauthorized(new ResponseModel<AuthModel>
                {
                    Dados = null,
                    Mensagem = "Token inválido.",
                    Status = false
                });
            }
        }

        [HttpPost("Logout")]
        public async Task<ActionResult<ResponseModel<object>>> Logout([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                return BadRequest(new ResponseModel<object>
                {
                    Dados = null,
                    Mensagem = "Token é obrigatório.",
                    Status = false
                });
            }

            RefreshTokensModel? storedRefreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

            if (storedRefreshToken != null)
            {
                storedRefreshToken.Revogado = true;
                await _context.SaveChangesAsync();
            }

            return Ok(new ResponseModel<object>
            {
                Dados = null,
                Mensagem = "Logout realizado com sucesso!",
                Status = true
            });
        }
    }

}