using System.ComponentModel.DataAnnotations;
using ApiEcoBin.Model.Enums;

namespace ApiEcoBin.ViewModel
{
    public class SensoresVM
    {
        [Required(ErrorMessage = "Device ID é obrigatório")]
        [MaxLength(50, ErrorMessage = "Device ID deve ter no máximo 50 caracteres")]
        public string DeviceId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Device Key é obrigatório")]
        [MaxLength(255, ErrorMessage = "Device Key deve ter no máximo 255 caracteres")]
        public string DeviceKey { get; set; } = string.Empty;

        [Required(ErrorMessage = "Status é obrigatório")]
        public int Status { get; set; } = (int)SensorStatus.inativo;

        public int? CondominioId { get; set; }

        public DateTime? UltimaConexao { get; set; }
    }
}
