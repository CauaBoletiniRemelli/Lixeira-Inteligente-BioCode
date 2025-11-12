using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.Telemetrias
{
    public class TelemetriaArduinoDTO
    {
        [Required]
        public int SensorId { get; set; }

        [Range(0, 100)]
        public float NivelLixo { get; set; }

        public float? Temperatura { get; set; }

        public float? Umidade { get; set; }

        public float? Distancia { get; set; }

        public int? Capacidade { get; set; }

        public bool? AlertaCheio { get; set; }

        public int? Bateria { get; set; }

        public string? DataHora { get; set; }
    }
}
