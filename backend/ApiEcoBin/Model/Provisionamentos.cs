using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Model
{
    [Table("provisionamentos")]
    public class Provisionamentos
    {
        [Key]
        public int id { get; private set; }
        
        [Required]
        public int sensor_id { get; private set; }
        
        [Required]
        [MaxLength(512)]
        public string ssid_criptografado { get; private set; }
        
        [Required]
        [MaxLength(1024)]
        public string senha_wifi_criptografada { get; private set; }
        
        [MaxLength(100)]
        public string? nome_sensor { get; private set; }
        
        [Required]
        public int criado_por { get; private set; }
        
        [Required]
        public DateTime expiracao { get; private set; }
        
        public bool usado { get; private set; }
        
        [Column("criado_em")]
        public DateTime criado_em { get; private set; }

        public Provisionamentos(int sensor_id, string ssid_criptografado, string senha_wifi_criptografada, 
                              string? nome_sensor, int criado_por, DateTime expiracao, bool usado = false)
        {
            this.sensor_id = sensor_id;
            this.ssid_criptografado = ssid_criptografado ?? throw new ArgumentNullException(nameof(ssid_criptografado));
            this.senha_wifi_criptografada = senha_wifi_criptografada ?? throw new ArgumentNullException(nameof(senha_wifi_criptografada));
            this.nome_sensor = nome_sensor;
            this.criado_por = criado_por;
            this.expiracao = expiracao;
            this.usado = usado;
            this.criado_em = DateTime.UtcNow;
        }

        private Provisionamentos() 
        {
            ssid_criptografado = string.Empty;
            senha_wifi_criptografada = string.Empty;
        }
    }
}
