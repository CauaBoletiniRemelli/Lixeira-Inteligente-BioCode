using System.ComponentModel.DataAnnotations;
using ApiEcoBin.Model.Enums;

namespace ApiEcoBin.ViewModel
{
    public class UsuariosVM
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [MaxLength(100, ErrorMessage = "Nome deve ter no máximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email é obrigatório")]
        [EmailAddress(ErrorMessage = "Email inválido")]
        [MaxLength(100, ErrorMessage = "Email deve ter no máximo 100 caracteres")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha é obrigatória")]
        [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
        public string SenhaHash { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tipo é obrigatório")]
        public int Tipo { get; set; }
    }
}
