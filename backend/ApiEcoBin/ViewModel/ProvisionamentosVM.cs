    using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.ViewModel
{
    public class ProvisionamentosVM
    {
        [Required(ErrorMessage = "Sensor ID é obrigatório")]
        public int SensorId { get; set; }

        [Required(ErrorMessage = "SSID criptografado é obrigatório")]
        [MaxLength(512, ErrorMessage = "SSID deve ter no máximo 512 caracteres")]
        public string SsidCriptografado { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha WiFi criptografada é obrigatória")]
        [MaxLength(1024, ErrorMessage = "Senha WiFi deve ter no máximo 1024 caracteres")]
        public string SenhaWifiCriptografada { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Nome do sensor deve ter no máximo 100 caracteres")]
        public string? NomeSensor { get; set; }

        [Required(ErrorMessage = "Criado por é obrigatório")]
        public int CriadoPor { get; set; }

        [Required(ErrorMessage = "Data de expiração é obrigatória")]
        [DataType(DataType.DateTime)]
        public DateTime Expiracao { get; set; }

        public bool Usado { get; set; } = false;
    }
}
