using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Requests
{
    public class CreateUsuarioRequest
    {
        [Required]
        public string? Nome { get; set; }
        [Required]
        public string? Email { get; set; }
        [Required]
        public string? Senha { get; set; }
        public int Tipo { get; set; }
    }
}
