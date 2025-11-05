using ApiEcoBin.Data;
using ApiEcoBin.Enums;
using ApiEcoBin.Models;
using ApiEcoBin.Requests;
using ApiEcoBin.Services;
using ApiEcoBin.Services.Email;
using ApiEcoBin.Services.PasswordHash;
using Microsoft.AspNetCore.Authorization;
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
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IPasswordHashService passwordHashService, TokenService tokenService, IConfiguration configuration)
        {
            _context = context;
            _passwordHashService = passwordHashService;
            _tokenService = tokenService;
            _configuration = configuration;
        }

        [HttpPost("AppLogin")]
        public ActionResult<ResponseModel<AuthModel>> AppLogin([FromBody] AppLoginRequest request)
        {
            try
            {
                var appId = _configuration["AppCredentials:AppId"];
                var appSecret = _configuration["AppCredentials:AppSecret"];

                if (string.IsNullOrEmpty(request.AppId) ||
                    string.IsNullOrEmpty(request.AppSecret) ||
                    request.AppId != appId ||
                    request.AppSecret != appSecret)
                {
                    return Unauthorized(new ResponseModel<AuthModel>
                    {
                        Dados = null,
                        Mensagem = "Credenciais do aplicativo inválidas.",
                        Status = false
                    });
                }

                var appUser = new UsuariosModel
                {
                    Id = 0, 
                    Email = "app@ecobin.com",
                    Nome = "EcoBin Mobile App",
                    Tipo = TipoUsuario.Aplicativo,
                    CondominioId = null
                };

                object token = TokenService.GenerateToken(appUser);
                string refreshToken = TokenService.GenerateRefreshToken();

                return Ok(new ResponseModel<AuthModel>
                {
                    Dados = new AuthModel
                    {
                        Token = token,
                        RefreshToken = refreshToken,
                        UserId = 0,
                        Email = appUser.Email,
                        Nome = appUser.Nome,
                        Tipo = TipoUsuario.Aplicativo
                    },
                    Mensagem = "Autenticação do aplicativo realizada com sucesso!",
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

        [Authorize(Policy = "AppOnly")]
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

        [Authorize(Policy = "AppOnly")]
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

        [Authorize(Policy = "AppOnly")]
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

        [Authorize(Policy = "AppOnly")]
        [HttpPost("forgot-password")]
        public async Task<ActionResult<ResponseModel<UsuariosModel>>> ForgotMyPassword(string usuEmail)
        {
            ResponseModel<UsuariosModel> response = new();
            try
            {
                UsuariosModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Email == usuEmail);
                if (user == null)
                {
                    response.Mensagem = "Nenhum usuário localizado!";
                    response.Status = true;
                    return response;
                }

                string randomPassword = GenerateRandomPassword(6);
                string mensagemEmail = $@"<p>Olá <strong>{user.Nome}</strong>,</p>
                                          <p>Você solicitou a redefinição de sua senha.</p>

                                          <p><strong>Sua nova senha temporária é:</strong> {randomPassword}</p>

                                          <p>Por favor, faça login e altere sua senha o mais rápido possível.</p>

                                          <p>Atenciosamente,<br>
                                          Equipe EcoBin</p>";

                SendEmail email = new();
                email.Send(user.Email!, "Redefinição de Senha", mensagemEmail);

                user.SenhaHash = _passwordHashService.HashPassword(randomPassword);
                _context.Usuarios.Update(user);
                await _context.SaveChangesAsync();

                response.Dados = null;
                response.Mensagem = "Instruções para redefinir a senha foram enviadas para o email cadastrado. Caso o e-mail não apareça, verifique sua caixa de SPAM";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }
            return response;
        }

        private string GenerateRandomPassword(int length = 6)
        {
            const string validChars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*()?-";
            Random random = new();
            char[] chars = new char[length];
            for (int i = 0; i < length; i++)
            {
                chars[i] = validChars[random.Next(validChars.Length)];
            }
            return new string(chars);
        }
    }

}