using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("EXPoTokens")]
    public class ExpoTokensModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("EXP_USUId")]
        public int UsuarioId { get; set; }

        [Required]
        [Column("EXPToken")]
        [MaxLength(500)]
        public string? Token { get; set; }

        [Column("EXPDispositivo")]
        [MaxLength(255)]
        public string? Dispositivo { get; set; }

        [Column("EXPPlataforma")]
        [MaxLength(50)]
        public string? Plataforma { get; set; } 

        [Column("EXPDataCriacao")]
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        [Column("EXPUltimaAtualizacao")]
        public DateTime? UltimaAtualizacao { get; set; }

        [Column("EXPAtivo")]
        public bool Ativo { get; set; } = true;

        [ForeignKey("UsuarioId")]
        [JsonIgnore]
        public virtual UsuariosModel? Usuario { get; set; }

        [JsonIgnore]
        public virtual ICollection<NotificacoesModel> Notificacoes { get; set; } = [];
    }
}