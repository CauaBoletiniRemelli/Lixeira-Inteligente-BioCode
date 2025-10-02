using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Model
{
    [Table("telemetrias")]
    public class Telemetrias
    {
        [Key]
        public int id { get; private set; }
        
        [Required]
        public int sensor_id { get; private set; }
        
        [Required]
        public DateTime momento { get; private set; }
        
        public int? nivel_ocupacao { get; private set; }
        
        public int? bateria { get; private set; }
        
        [Column(TypeName = "numeric(6,2)")]
        public decimal? temperatura { get; private set; }
        
        [Column(TypeName = "jsonb")]
        public string? dados_brutos { get; private set; }

        public Telemetrias(int sensor_id, int? nivel_ocupacao = null, int? bateria = null, 
                          decimal? temperatura = null, string? dados_brutos = null)
        {
            this.sensor_id = sensor_id;
            this.momento = DateTime.UtcNow;
            this.nivel_ocupacao = nivel_ocupacao;
            this.bateria = bateria;
            this.temperatura = temperatura;
            this.dados_brutos = dados_brutos;
        }

        private Telemetrias() { }
    }
}
