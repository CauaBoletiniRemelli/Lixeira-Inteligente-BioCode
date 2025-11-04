using ApiEcoBin.Enums;

namespace ApiEcoBin.Models
{
    public class AuthModel
    {
        public string? Email { get; set; }
        public string? Nome { get; set; }
        public int UserId { get; set; }
        public TipoUsuario Tipo { get; set; }
        public int CondominioId { get; set; }
        public object? Token { get; set; }
        public string? RefreshToken { get; set; }
    }
}
