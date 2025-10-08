using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Usuario
{
    public interface IUsuarioInterface
    {
        Task<ResponseModel<List<UsuarioModel>>> GetUsers();
        Task<ResponseModel<UsuarioModel>> GetUserById(int idUsuario);
        Task<ResponseModel<List<UsuarioModel>>> GetUsersByIdCon(int idCondominio);
        Task<ResponseModel<UsuarioModel>> CreateUser(UsuarioModel usuario, string senha);
    }
}
