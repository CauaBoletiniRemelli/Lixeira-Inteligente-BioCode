using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("USUarios")]
    public class UsuarioModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("USUNome")]
        [MaxLength(100)]
        public string? Nome { get; set; }

        [Required]
        [Column("USUEmail")]
        [MaxLength(100)]
        public string? Email { get; set; }

        [Required]
        [Column("USUSenhaHash")]
        [MaxLength(255)]
        public string? SenhaHash { get; set; }

        [Required]
        [Column("USUTipo")]
        public int Tipo { get; set; } = 0;

        [Column("USUCriadoEm")]
        public DateTime? CriadoEm { get; set; } = DateTime.Now;

        [JsonIgnore]
        public virtual ICollection<ProvisionamentoModel> Provisionamentos { get; set; } = [];
    }
}
