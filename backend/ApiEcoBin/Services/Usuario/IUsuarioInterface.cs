using ApiEcoBin.Dto.Usuarios;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Usuario
{
    public interface IUsuarioInterface
    {
        Task<ResponseModel<List<UsuariosModel>>> GetUsers();
        Task<ResponseModel<UsuariosModel>> GetUserById(int idUsuario);
        Task<ResponseModel<UsuariosModel>> CreateUser(UserCreateDTO userCreateDTO);
        Task<ResponseModel<UsuariosModel>> UpdateUser(UserEditDTO userCreateDTO);
        Task<ResponseModel<UsuariosModel>> ChangePassword(ChangePasswordDTO changePasswordDTO);
        Task<ResponseModel<UsuariosModel>> ForgotMyPassword(string emailUsu);
        Task<ResponseModel<List<UsuariosModel>>> DeleteUser(int idUser);
    }
}
