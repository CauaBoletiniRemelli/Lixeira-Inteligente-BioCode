using ApiEcoBin.Data;
using ApiEcoBin.Models;
using ApiEcoBin.Services.Usuario;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Services.Usuarios
{
    public class UsuarioService(AppDbContext context) : IUsuarioInterface
    {
        private readonly AppDbContext _context = context;

        public Task<ResponseModel<UsuarioModel>> GetUserById(int idUsuario)
        {
            throw new NotImplementedException();
        }

        public async Task<ResponseModel<List<UsuarioModel>>> GetUsers()
        {
            ResponseModel<List<UsuarioModel>> response = new ResponseModel<List<UsuarioModel>>();
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
    }
}
