using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.ViewModel
{
    public class TelemetriasVM
    {
        [Required(ErrorMessage = "Sensor ID é obrigatório")]
        public int SensorId { get; set; }

        [Range(0, 100, ErrorMessage = "Nível de ocupação deve estar entre 0 e 100")]
        public int? NivelOcupacao { get; set; }

        [Range(0, 100, ErrorMessage = "Bateria deve estar entre 0 e 100")]
        public int? Bateria { get; set; }

        [Range(-50, 100, ErrorMessage = "Temperatura deve estar entre -50 e 100 graus")]
        public decimal? Temperatura { get; set; }

        public string? DadosBrutos { get; set; }
    }
}
