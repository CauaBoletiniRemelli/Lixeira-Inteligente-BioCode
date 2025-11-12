using ApiEcoBin.Models;
using ApiEcoBin.Requests;

namespace ApiEcoBin.Services.Auth
{
    public interface IAuthInterface
    {
        Task<ResponseModel<AuthModel>> AppLogin(AppLoginRequest request);
        Task<ResponseModel<AuthModel>> ArduinoLogin(ArduinoLoginRequest request);
        Task<ResponseModel<AuthModel>> Login(LoginRequest request);
        Task<ResponseModel<AuthModel>> RefreshToken(RefreshTokenRequest request);
        Task<ResponseModel<object>> Logout(RefreshTokenRequest request);
        Task<ResponseModel<UsuariosModel>> ForgotPassword(string usuEmail);
    }
}
