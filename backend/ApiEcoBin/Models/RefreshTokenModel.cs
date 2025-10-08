using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Models
{
    [Table("REFreshTokens")]
    public class RefreshTokenModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("REF_USUId")]
        public int UsuarioId { get; set; }

        [Required]
        [Column("REFToken")]
        [MaxLength(500)]
        public string? Token { get; set; }

        [Required]
        [Column("REFExpiracao")]
        public DateTime Expiracao { get; set; }

        [Column("REFCriadoEm")]
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        [Column("REFRevogado")]
        public bool Revogado { get; set; } = false;

        [ForeignKey("UsuarioId")]
        public virtual required UsuarioModel Usuario { get; set; }
    }
}