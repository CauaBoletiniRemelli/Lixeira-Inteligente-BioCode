using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiEcoBin.Model.Enums;

namespace ApiEcoBin.Model
{
    [Table("sensores")]
    public class Sensores
    {
        [Key]
        public int id { get; private set; }
        
        [Required]
        [MaxLength(50)]
        public string device_id { get; private set; }
        
        [Required]
        [MaxLength(255)]
        public string device_key { get; private set; }
        
        [Column(TypeName = "sensor_status")]
        public int status { get; private set; }
        
        public int? condominio_id { get; private set; }
        
        public DateTime? ultima_conexao { get; private set; }
        
        [Column("criado_em")]
        public DateTime criado_em { get; private set; }

        public Sensores(string device_id, string device_key, int status, int? condominio_id, DateTime? ultima_conexao = null)
        {
            this.device_id = device_id ?? throw new ArgumentNullException(nameof(device_id));
            this.device_key = device_key ?? throw new ArgumentNullException(nameof(device_key));
            this.status = status;
            this.condominio_id = condominio_id;
            this.ultima_conexao = ultima_conexao;
            this.criado_em = DateTime.UtcNow;
        }

        private Sensores() 
        {
            device_id = string.Empty;
            device_key = string.Empty;
        }
    }
}
