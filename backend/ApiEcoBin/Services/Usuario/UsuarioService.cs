using ApiEcoBin.Data;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Usuario;
using Microsoft.EntityFrameworkCore;
using ApiEcoBin.Services.PasswordHash;

namespace ApiEcoBin.Services.Usuarios
{
    public class UsuarioService(AppDbContext context, IPasswordHashService passwordHashService) : IUsuarioInterface
    {
        private readonly AppDbContext _context = context;
        private readonly IPasswordHashService _passwordHashService = passwordHashService;

        public async Task<ResponseModel<UsuarioModel>> GetUserById(int idUser)
        {
            ResponseModel<UsuarioModel> response = new();
            try
            {
                UsuarioModel? user = await _context.Usuarios.FirstOrDefaultAsync(user => user.Id == idUser);

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

        public async Task<ResponseModel<List<UsuarioModel>>> GetUsers()
        {
            ResponseModel<List<UsuarioModel>> response = new();
            try
            {
                List<UsuarioModel> users = await _context.Usuarios.ToListAsync();

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

        public Task<ResponseModel<List<UsuarioModel>>> GetUsersByIdCon(int idCondominio)
        {
            throw new NotImplementedException();
        }

        public async Task<ResponseModel<UsuarioModel>> CreateUser(UsuarioModel usuario, string senha)
        {
            ResponseModel<UsuarioModel> response = new ResponseModel<UsuarioModel>();
            
            try
            {
                usuario.SenhaHash = _passwordHashService.HashPassword(senha);
                usuario.CriadoEm = DateTime.Now;
                
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
    }
}
