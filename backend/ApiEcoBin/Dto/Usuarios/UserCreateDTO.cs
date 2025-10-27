using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.Usuarios
{
    public class UserCreateDTO
    {
        [Required]
        public string? Nome { get; set; }
        [Required]
        public string? Email { get; set; }
        [Required]
        public string? SenhaHash { get; set; }
        public int Tipo { get; set; } = 0;
    }
}
