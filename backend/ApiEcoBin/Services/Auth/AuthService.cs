using ApiEcoBin.Data;
using ApiEcoBin.Enums;
using ApiEcoBin.Models;
using ApiEcoBin.Requests;
using ApiEcoBin.Services.Email;
using ApiEcoBin.Services.PasswordHash;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

namespace ApiEcoBin.Services.Auth
{
    public class AuthService : IAuthInterface
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHashService _passwordHashService;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IPasswordHashService passwordHashService, IConfiguration configuration)
        {
            _context = context;
            _passwordHashService = passwordHashService;
            _configuration = configuration;
        }

        public async Task<ResponseModel<AuthModel>> AppLogin(AppLoginRequest request)
        {
            ResponseModel<AuthModel> response = new();
            try
            {
                var appId = _configuration["AppCredentials:AppId"];
                var appSecret = _configuration["AppCredentials:AppSecret"];

                if (string.IsNullOrEmpty(request.AppId) ||
                    string.IsNullOrEmpty(request.AppSecret) ||
                    request.AppId != appId ||
                    request.AppSecret != appSecret)
                {
                    response.Dados = null;
                    response.Mensagem = "Credenciais do aplicativo inválidas.";
                    response.Status = false;
                    return response;
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

                response.Dados = new AuthModel
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    UserId = 0,
                    Email = appUser.Email,
                    Nome = appUser.Nome,
                    Tipo = TipoUsuario.Aplicativo
                };
                response.Mensagem = "Autenticação do aplicativo realizada com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Dados = null;
                response.Mensagem = ex.Message;
                response.Status = false;
            }
            return response;
        }

        public async Task<ResponseModel<AuthModel>> Login(LoginRequest request)
        {
            ResponseModel<AuthModel> response = new();
            try
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    response.Dados = null;
                    response.Mensagem = "Email e senha são obrigatórios.";
                    response.Status = false;
                    return response;
                }

                UsuariosModel? usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (usuario == null || string.IsNullOrEmpty(usuario.SenhaHash) || !_passwordHashService.VerifyPassword(request.Password, usuario.SenhaHash))
                {
                    response.Dados = null;
                    response.Mensagem = "E-mail ou senha incorretos.";
                    response.Status = false;
                    return response;
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

                response.Dados = new AuthModel
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    UserId = usuario.Id,
                    Email = usuario.Email,
                    Nome = usuario.Nome,
                    Tipo = usuario.Tipo,
                    CondominioId = usuario.CondominioId,
                    NomeCondominio = condominio?.Nome
                };
                response.Mensagem = "Login realizado com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Dados = null;
                response.Mensagem = ex.Message;
                response.Status = false;
            }
            return response;
        }

        public async Task<ResponseModel<AuthModel>> RefreshToken(RefreshTokenRequest request)
        {
            ResponseModel<AuthModel> response = new();

            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                response.Dados = null;
                response.Mensagem = "Refresh token é obrigatório.";
                response.Status = false;
                return response;
            }

            try
            {
                RefreshTokensModel? storedRefreshToken = await _context.RefreshTokens
                    .Include(rt => rt.Usuario)
                    .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

                if (storedRefreshToken == null)
                {
                    response.Dados = null;
                    response.Mensagem = "Refresh token não encontrado.";
                    response.Status = false;
                    return response;
                }

                if (storedRefreshToken.Revogado)
                {
                    response.Dados = null;
                    response.Mensagem = "Refresh token já foi utilizado ou revogado. Faça login novamente.";
                    response.Status = false;
                    return response;
                }

                if (storedRefreshToken.Expiracao < DateTime.UtcNow)
                {
                    response.Dados = null;
                    response.Mensagem = "Refresh token expirado. Faça login novamente.";
                    response.Status = false;
                    return response;
                }

                var ultimoRefreshToken = await _context.RefreshTokens
                    .Where(rt => rt.UsuarioId == storedRefreshToken.UsuarioId && !rt.Revogado)
                    .OrderByDescending(rt => rt.CriadoEm)
                    .FirstOrDefaultAsync();

                if (ultimoRefreshToken != null && ultimoRefreshToken.Id != storedRefreshToken.Id)
                {
                    response.Dados = null;
                    response.Mensagem = "Token não é o mais recente. Utilize o último refresh token recebido.";
                    response.Status = false;
                    return response;
                }

                // Validar o AccessToken apenas se fornecido (opcional agora)
                if (!string.IsNullOrEmpty(request.AccessToken))
                {
                    try
                    {
                        ClaimsPrincipal? principal = TokenService.GetPrincipalFromExpiredToken(request.AccessToken);
                        if (principal != null)
                        {
                            string? userIdClaim = principal.FindFirst("userId")?.Value;
                            if (!string.IsNullOrEmpty(userIdClaim))
                            {
                                int tokenUserId = int.Parse(userIdClaim);
                                if (tokenUserId != storedRefreshToken.UsuarioId)
                                {
                                    response.Dados = null;
                                    response.Mensagem = "Token não corresponde ao usuário.";
                                    response.Status = false;
                                    return response;
                                }
                            }
                        }
                    }
                    catch
                    {
                    }
                }

                // Gerar novos tokens
                object newAccessToken = TokenService.GenerateToken(storedRefreshToken.Usuario);
                string newRefreshToken = TokenService.GenerateRefreshToken();

                // Revogar o token antigo
                storedRefreshToken.Revogado = true;

                // Criar novo refresh token
                RefreshTokensModel newRefreshTokenModel = new RefreshTokensModel
                {
                    UsuarioId = storedRefreshToken.UsuarioId,
                    Token = newRefreshToken,
                    Expiracao = DateTime.UtcNow.AddDays(7),
                    Usuario = storedRefreshToken.Usuario
                };

                _context.RefreshTokens.Add(newRefreshTokenModel);
                await _context.SaveChangesAsync();

                CondominiosModel? condominio = await _context.Condominios
                    .FirstOrDefaultAsync(c => c.Id == storedRefreshToken.Usuario.CondominioId);

                response.Dados = new AuthModel
                {
                    Token = newAccessToken,
                    RefreshToken = newRefreshToken,
                    UserId = storedRefreshToken.Usuario.Id,
                    Email = storedRefreshToken.Usuario.Email,
                    Nome = storedRefreshToken.Usuario.Nome,
                    Tipo = storedRefreshToken.Usuario.Tipo,
                    CondominioId = storedRefreshToken.Usuario.CondominioId,
                    NomeCondominio = condominio?.Nome
                };
                response.Mensagem = "Token renovado com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Dados = null;
                response.Mensagem = $"Erro ao renovar token: {ex.Message}";
                response.Status = false;
            }
            return response;
        }

        public async Task<ResponseModel<object>> Logout(RefreshTokenRequest request)
        {
            ResponseModel<object> response = new();

            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                response.Dados = null;
                response.Mensagem = "Token é obrigatório.";
                response.Status = false;
                return response;
            }

            try
            {
                RefreshTokensModel? storedRefreshToken = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

                if (storedRefreshToken != null)
                {
                    storedRefreshToken.Revogado = true;
                    await _context.SaveChangesAsync();
                }

                response.Dados = null;
                response.Mensagem = "Logout realizado com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Dados = null;
                response.Mensagem = ex.Message;
                response.Status = false;
            }
            return response;
        }

        public async Task<ResponseModel<UsuariosModel>> ForgotPassword(string usuEmail)
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
                                          <p>Ao acessar sua conta, navegue até a seção de configurações e desça para alterar sua senha.</p>

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
