using ApiEcoBin.Enums;
using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.Usuarios
{
    public class ChangePasswordDTO
    {
        [Required]
        public int ID { get; set; }
        [Required]
        public string? OldPassword { get; set; }
        [Required]
        public string? NewPassword { get; set; }
    }
}
