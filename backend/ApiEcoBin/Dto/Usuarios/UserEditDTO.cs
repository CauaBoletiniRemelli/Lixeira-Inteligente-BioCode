using ApiEcoBin.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Dto.Usuarios
{
    public class UserEditDTO
    {
        public int Id { get; set; }

        public string? Nome { get; set; }

        public string? Email { get; set; }
        public string? SenhaHash { get; set; }
        public TipoUsuario Tipo { get; set; }
        public int? CondominioId { get; set; }
    }
}
