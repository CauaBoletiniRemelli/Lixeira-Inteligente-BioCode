using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    /// <summary>
    /// Registro de cada vez que o recipiente de óleo de cozinha é esvaziado e encaminhado para destinação.
    /// </summary>
    [Table("OLEColetas")]
    public class OleoColetasModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Column("OLE_CONId")]
        public int CondominioId { get; set; }

        [Column("OLE_SENId")]
        public int? SensorId { get; set; }

        [Column("OLE_USUId")]
        public int? UsuarioId { get; set; }

        [Required]
        [Column("OLELitros", TypeName = "decimal(8,2)")]
        public decimal Litros { get; set; }

        [Column("OLEDestino")]
        [MaxLength(150)]
        public string? Destino { get; set; }

        [Column("OLEObservacao")]
        [MaxLength(500)]
        public string? Observacao { get; set; }

        [Column("OLEDataColeta")]
        public DateTime DataColeta { get; set; } = DateTime.UtcNow;

        [Column("OLECriadoEm")]
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        [ForeignKey(nameof(CondominioId))]
        public virtual CondominiosModel? Condominio { get; set; }

        [JsonIgnore]
        [ForeignKey(nameof(SensorId))]
        public virtual SensoresModel? Sensor { get; set; }

        [JsonIgnore]
        [ForeignKey(nameof(UsuarioId))]
        public virtual UsuariosModel? Usuario { get; set; }
    }
}
