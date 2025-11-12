using ApiEcoBin.Enums;
using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.ExpoTokens
{
    public class NotificacaoCondominioTipoDTO
    {
        [Required]
        public int CondominioId { get; set; }

        [Required]
        public TipoUsuario TipoUsuario { get; set; }

        [Required]
        public string? Titulo { get; set; }

        [Required]
        public string? Mensagem { get; set; }

        public string? Dados { get; set; }
    }
}
