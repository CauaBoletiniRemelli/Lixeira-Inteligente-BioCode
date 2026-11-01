using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("TELemetrias")]
    public class TelemetriasModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

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

        [Column("TELTensaoBateria", TypeName = "decimal(5,2)")]
        public decimal? TensaoBateria { get; set; }

        [Column("TELTensaoPainel", TypeName = "decimal(5,2)")]
        public decimal? TensaoPainel { get; set; }

        /// <summary>
        /// Corrente de carga vinda do painel, em mA. Só preenchida quando houver sensor de corrente (ex.: INA219).
        /// </summary>
        [Column("TELCorrentePainel", TypeName = "decimal(8,2)")]
        public decimal? CorrentePainel { get; set; }

        [Column("TELCarregando")]
        public bool? Carregando { get; set; }

        [Column("TELDadosBrutos", TypeName = "nvarchar(max)")]
        public string? DadosBrutos { get; set; }

        [JsonIgnore]
        [ForeignKey("SensorId")]
        public virtual SensoresModel? Sensor { get; set; }
    }
}
