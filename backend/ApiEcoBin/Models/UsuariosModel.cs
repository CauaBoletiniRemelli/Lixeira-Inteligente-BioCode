using ApiEcoBin.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("USUarios")]
    public class UsuariosModel
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
        public TipoUsuario Tipo { get; set; } = TipoUsuario.NaoIdentificado;

        [Column("USU_CONId")]
        public int? CondominioId { get; set; }

        [Column("USUCriadoEm")]
        public DateTime? CriadoEm { get; set; } = DateTime.Now;

        [ForeignKey("CondominioId")]
        public virtual CondominiosModel? Condominio { get; set; }

        [JsonIgnore]
        public virtual ICollection<ProvisionamentosModel> Provisionamentos { get; set; } = [];
    }
}