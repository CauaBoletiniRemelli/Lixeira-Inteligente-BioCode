using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.ExpoTokens
{
    public class ExpoTokenDesativarDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
}
