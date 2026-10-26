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

        // Alimentação solar (opcionais). Tensões medidas com divisor de tensão nos pinos analógicos.
        public float? TensaoBateria { get; set; }

        public float? TensaoPainel { get; set; }

        /// <summary>
        /// Corrente de carga do painel em mA. Requer sensor de corrente (ex.: INA219); omitir se não houver.
        /// </summary>
        public float? CorrentePainel { get; set; }

        /// <summary>
        /// Se omitido, o backend considera "carregando" quando TensaoPainel &gt; TensaoBateria.
        /// </summary>
        public bool? Carregando { get; set; }

        public string? DataHora { get; set; }
    }
}
