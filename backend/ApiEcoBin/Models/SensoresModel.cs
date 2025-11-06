using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("SENsores")]
    public class SensoresModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("SENDeviceId")]
        [MaxLength(50)]
        public string DeviceId { get; set; } = string.Empty;

        [Required]
        [Column("SENDeviceKey")]
        [MaxLength(255)]
        [JsonIgnore]
        public string DeviceKey { get; set; } = string.Empty;

        [Required]
        [Column("SENStatus")]
        public int Status { get; set; } = 0;

        [Column("SENNome")]
        [MaxLength(100)]
        public string? Nome { get; set; }

        [Column("SEN_CONId")]
        public int? CondominioId { get; set; }

        [Column("SENLatitude", TypeName = "decimal(10,8)")]
        public decimal? Latitude { get; set; }

        [Column("SENLongitude", TypeName = "decimal(11,8)")]
        public decimal? Longitude { get; set; }

        [Column("SENUltimaConexao")]
        public DateTime? UltimaConexao { get; set; }

        [Column("SENCriadoEm")]
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(CondominioId))]
        public virtual CondominiosModel? Condominio { get; set; }

        [JsonIgnore]
        public virtual ICollection<ProvisionamentosModel> Provisionamentos { get; set; } = new List<ProvisionamentosModel>();

        [JsonIgnore]
        public virtual ICollection<TelemetriasModel> Telemetrias { get; set; } = new List<TelemetriasModel>();
    }
}
