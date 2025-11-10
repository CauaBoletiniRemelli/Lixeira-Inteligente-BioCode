using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.ExpoTokens
{
    public class ExpoTokenCreateDTO
    {
        [Required]
        public int UsuarioId { get; set; }

        [Required]
        public string? Token { get; set; }

        public string? Dispositivo { get; set; }

        public string? Plataforma { get; set; }
    }
}