using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.ViewModel
{
    public class CondominiosVM
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [MaxLength(100, ErrorMessage = "Nome deve ter no máximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(255, ErrorMessage = "Endereço deve ter no máximo 255 caracteres")]
        public string? Endereco { get; set; }
    }
}
