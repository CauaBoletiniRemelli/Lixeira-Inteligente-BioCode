using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Models
{
    [Table("PROvisionamentos")]
    public class ProvisionamentosModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("PRO_SENId")]
        public int SensorId { get; set; }

        [Column("PROSsidCriptografado")]
        [MaxLength(512)]
        public string? SsidCriptografado { get; set; }

        [Column("PROSenhaWifiCriptografada")]
        [MaxLength(1024)]
        public string? SenhaWifiCriptografada { get; set; }

        [Column("PRONomeSensor")]
        [MaxLength(100)]
        public string? NomeSensor { get; set; }

        [Required]
        [Column("PRO_USUId")]
        public int UsuarioId { get; set; }

        [Required]
        [Column("PROExpiracao")]
        public DateTime Expiracao { get; set; }

        [Column("PROUsado")]
        public bool Usado { get; set; } = false;

        [Column("PROCriadoEm")]
        public DateTime? CriadoEm { get; set; } = DateTime.Now;

        [Column("PROSessionToken")]
        public string? SessionToken { get; set; }

        [Column("PROSessionExpires")]
        public DateTime? SessionExpires { get; set; }

        [ForeignKey("SensorId")]
        public virtual SensoresModel? Sensor { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual UsuariosModel? Usuario { get; set; }
    }
}
