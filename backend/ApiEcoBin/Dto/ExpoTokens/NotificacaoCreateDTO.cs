using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.ExpoTokens
{
    public class NotificacaoCreateDTO
    {
        [Required]
        public string? Titulo { get; set; }

        [Required]
        public string? Mensagem { get; set; }

        public string? Dados { get; set; }
    }
}