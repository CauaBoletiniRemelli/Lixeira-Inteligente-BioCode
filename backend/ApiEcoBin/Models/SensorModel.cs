using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("SENsores")]
    public class SensorModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("SENDeviceId")]
        [MaxLength(50)]
        public string? DeviceId { get; set; }

        [Required]
        [Column("SENDeviceKey")]
        [MaxLength(255)]
        public string? DeviceKey { get; set; }

        [Required]
        [Column("SENStatus")]
        public int Status { get; set; } = 0;

        [Column("SEN_CONId")]
        public int? CondominioId { get; set; } 

        [Column("SENUltimaConexao")]
        public DateTime? UltimaConexao { get; set; }

        [Column("SENCriadoEm")]
        public DateTime? CriadoEm { get; set; } = DateTime.Now;

        [ForeignKey("CondominioId")]
        public virtual CondominioModel? Condominio { get; set; }  

        [JsonIgnore]
        public virtual ICollection<ProvisionamentoModel> Provisionamentos { get; set; } = [];

        [JsonIgnore]
        public virtual ICollection<TelemetriaModel> Telemetrias { get; set; } = [];
    }
}