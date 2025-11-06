using ApiEcoBin.Data;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Usuario;
using Microsoft.EntityFrameworkCore;
using ApiEcoBin.Services.PasswordHash;
using ApiEcoBin.Dto.Usuarios;
using ApiEcoBin.Services.Email;

namespace ApiEcoBin.Services.Usuarios
{
    public class UsuarioService(AppDbContext context, IPasswordHashService passwordHashService) : IUsuarioInterface
    {
        private readonly AppDbContext _context = context;
        private readonly IPasswordHashService _passwordHashService = passwordHashService;

        public async Task<ResponseModel<UsuariosModel>> GetUserById(int idUser)
        {
            ResponseModel<UsuariosModel> response = new();
            try
            {
                UsuariosModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Id == idUser);

                if (user == null)
                {
                    response.Mensagem = "Usuário não encontrado.";
                    response.Status = false;
                    return response;
                }

                response.Dados = user;
                response.Mensagem = "Usuário encontrado com sucesso.";
                response.Status = true;

                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }

        public async Task<ResponseModel<List<UsuariosModel>>> GetUsers()
        {
            ResponseModel<List<UsuariosModel>> response = new();
            try
            {
                List<UsuariosModel> users = await _context.Usuarios.ToListAsync();

                if (users.Count > 0)
                {
                    response.Dados = users;
                    response.Mensagem = "Usuários encontrados com sucesso.";
                    response.Status = true;
                    return response;
                }

                response.Mensagem = "Nenhum usuário encontrado.";
                response.Status = true;

                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }

        public async Task<ResponseModel<UsuariosModel>> CreateUser(UserCreateDTO userCreateDTO)
        {
            ResponseModel<UsuariosModel> response = new();
            
            try
            {
                UsuariosModel usuario = new()
                {
                    Nome = userCreateDTO.Nome,
                    SenhaHash = userCreateDTO.SenhaHash,
                    Email = userCreateDTO.Email,
                    Tipo = userCreateDTO.Tipo,
                    CondominioId = userCreateDTO.CondominioId,
                    CriadoEm = DateTime.Now
                };

                usuario.SenhaHash = _passwordHashService.HashPassword(usuario.SenhaHash!);
                
                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                string mensagemEmail = $@"<p>Olá <strong>{usuario.Nome}</strong>,</p>
                                          <p>Seja muito bem-vindo ao <strong>EcoBin</strong>! Estamos felizes em tê-lo conosco.</p>
                                          <p>Qualquer dúvida, envie um e-mail para grupoecobin@gmail.com</p>
                                          <p>Atenciosamente,<br>
                                          Equipe EcoBin</p>";

                SendEmail email = new();
                email.Send(usuario.Email!, "Seja bem-vindo ao EcoBin", mensagemEmail);

                response.Dados = usuario;
                response.Mensagem = "Usuário criado com sucesso.";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }
            
            return response;
        }

        public async Task<ResponseModel<UsuariosModel>> UpdateUser(UserEditDTO userEditDTO)
        {
            ResponseModel<UsuariosModel> response = new();

            try
            {
                UsuariosModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Id == userEditDTO.Id);

                if (user == null)
                {
                    response.Mensagem = "Nenhum usuário localizado!";
                    response.Status = true;
                    return response;
                }

                if (!string.IsNullOrWhiteSpace(userEditDTO.Nome) || user.Nome != userEditDTO.Nome)
                {
                    user.Nome = userEditDTO.Nome;
                }

                if (!string.IsNullOrWhiteSpace(userEditDTO.Email) || user.Email != userEditDTO.Email)
                {
                    user.Email = userEditDTO.Email;
                }

                if (userEditDTO.Tipo > 0 || user.Tipo != userEditDTO.Tipo)
                {
                    user.Tipo = userEditDTO.Tipo;
                }

                if (userEditDTO.CondominioId > 0 || user.CondominioId != userEditDTO.CondominioId)
                {
                    user.CondominioId = userEditDTO.CondominioId;
                }

                if (!string.IsNullOrWhiteSpace(userEditDTO.SenhaHash))
                {
                    user.SenhaHash = _passwordHashService.HashPassword(userEditDTO.SenhaHash);
                }

                _context.Usuarios.Update(user);
                await _context.SaveChangesAsync();

                response.Dados = user;
                response.Mensagem = "Usuário atualizado com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }

            return response;
        }

        public async Task<ResponseModel<UsuariosModel>> ChangePassword(ChangePasswordDTO changePasswordDTO)
        {
            ResponseModel<UsuariosModel> response = new();
            try
            {
                UsuariosModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Id == changePasswordDTO.ID);
                if (user == null)
                {
                    response.Mensagem = "Nenhum usuário localizado!";
                    response.Status = true;
                    return response;
                }
                bool isOldPasswordValid = _passwordHashService.VerifyPassword(changePasswordDTO.OldPassword!, user.SenhaHash!);
                if (!isOldPasswordValid)
                {
                    response.Mensagem = "Senha antiga incorreta!";
                    response.Status = true;
                    return response;
                }
                user.SenhaHash = _passwordHashService.HashPassword(changePasswordDTO.NewPassword!);
                _context.Usuarios.Update(user);
                await _context.SaveChangesAsync();
                response.Dados = user;
                response.Mensagem = "Senha alterada com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }
            return response;
        }

        public async Task<ResponseModel<UsuariosModel>> ChangeEmail(ChangeEmailDTO changeEmailDTO)
        {
            ResponseModel<UsuariosModel> response = new();
            try
            {
                UsuariosModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Id == changeEmailDTO.ID);
                if (user == null)
                {
                    response.Mensagem = "Nenhum usuário localizado!";
                    response.Status = true;
                    return response;
                }
                bool isOldPasswordValid = changeEmailDTO.OldEmail == user.Email;

                if (!isOldPasswordValid)
                {
                    response.Mensagem = "E-mail antigo incorreto!";
                    response.Status = true;
                    return response;
                }

                user.Email = changeEmailDTO.NewEmail!;
                _context.Usuarios.Update(user);
                await _context.SaveChangesAsync();

                response.Dados = user;
                response.Mensagem = "E-mail alterado com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }
            return response;
        }

        public async Task<ResponseModel<List<UsuariosModel>>> DeleteUser(int idUser)
        {
            ResponseModel<List<UsuariosModel>> response = new();

            try
            {
                UsuariosModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Id == idUser);

                if (user == null)
                {
                    response.Mensagem = "Nenhum usuário localizado!";
                    response.Status = true;
                    return response;
                }

                _context.Usuarios.Remove(user);
                await _context.SaveChangesAsync();

                response.Dados = await _context.Usuarios.ToListAsync();
                response.Mensagem = "Usuário removido com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }

            return response;
        }
    }
}
