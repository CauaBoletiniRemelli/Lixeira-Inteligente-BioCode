using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.Usuarios
{
    public class ChangeEmailDTO
    {
        [Required]
        public int ID { get; set; }
        [Required]
        public string? OldEmail { get; set; }
        [Required]
        public string? NewEmail { get; set; }
    }
}
