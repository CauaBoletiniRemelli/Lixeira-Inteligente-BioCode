using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("NOTificacoes")]
    public class NotificacoesModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Column("NOT_EXPId")]
        public int? ExpoTokenId { get; set; }

        [Column("NOT_USUId")]
        public int? UsuarioId { get; set; }

        [Required]
        [Column("NOTTitulo")]
        [MaxLength(255)]
        public string? Titulo { get; set; }

        [Required]
        [Column("NOTMensagem")]
        [MaxLength(1000)]
        public string? Mensagem { get; set; }

        [Column("NOTDados")]
        public string? Dados { get; set; }

        [Column("NOTDataEnvio")]
        public DateTime DataEnvio { get; set; } = DateTime.UtcNow;

        [Column("NOTLida")]
        public bool Lida { get; set; } = false;

        [Column("NOTDataLeitura")]
        public DateTime? DataLeitura { get; set; }

        [Column("NOTEnviada")]
        public bool Enviada { get; set; } = false;

        [Column("NOTErro")]
        [MaxLength(500)]
        public string? Erro { get; set; }

        [ForeignKey("ExpoTokenId")]
        [JsonIgnore]
        public virtual ExpoTokensModel? ExpoToken { get; set; }

        [ForeignKey("UsuarioId")]
        [JsonIgnore]
        public virtual UsuariosModel? Usuario { get; set; }
    }
}