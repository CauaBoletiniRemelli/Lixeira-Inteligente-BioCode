using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Models
{
    [Table("TELemetrias")]
    public class TelemetriasModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("TEL_SENId")]
        public int SensorId { get; set; }

        [Column("TELMomento")]
        public DateTime? Momento { get; set; } = DateTime.Now;

        [Column("TELNivelOcupacao")]
        public int? NivelOcupacao { get; set; }

        [Column("TELBateria")]
        public int? Bateria { get; set; }

        [Column("TELTemperatura", TypeName = "decimal(6,2)")]
        public decimal? Temperatura { get; set; }

        [Column("TELDadosBrutos", TypeName = "nvarchar(max)")]
        public string? DadosBrutos { get; set; }

        [ForeignKey("SensorId")]
        public required virtual SensoresModel Sensor { get; set; }
    }
}
