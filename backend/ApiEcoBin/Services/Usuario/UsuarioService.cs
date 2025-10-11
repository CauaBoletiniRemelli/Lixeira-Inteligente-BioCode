using ApiEcoBin.Data;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Usuario;
using Microsoft.EntityFrameworkCore;
using ApiEcoBin.Services.PasswordHash;
using ApiEcoBin.Dto.Usuarios;

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
                    CriadoEm = DateTime.Now
                };

                usuario.SenhaHash = _passwordHashService.HashPassword(usuario.SenhaHash!);
                
                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();
                
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

        public async Task<ResponseModel<UsuariosModel>> UpdateUser(UserEditDTO userCreateDTO)
        {
            ResponseModel<UsuariosModel> response = new();

            try
            {
                UsuariosModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Id == userCreateDTO.Id);

                if (user == null)
                {
                    response.Mensagem = "Nenhum usuário localizado!";
                    response.Status = true;
                    return response;
                }

                if (!string.IsNullOrWhiteSpace(userCreateDTO.Nome))
                {
                    user.Nome = userCreateDTO.Nome;
                }

                if (!string.IsNullOrWhiteSpace(userCreateDTO.Email))
                {
                    user.Email = userCreateDTO.Email;
                }

                if (userCreateDTO.Tipo >= 0)
                {
                    user.Tipo = userCreateDTO.Tipo;
                }

                if (!string.IsNullOrWhiteSpace(userCreateDTO.SenhaHash))
                {
                    user.SenhaHash = _passwordHashService.HashPassword(userCreateDTO.SenhaHash);
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
