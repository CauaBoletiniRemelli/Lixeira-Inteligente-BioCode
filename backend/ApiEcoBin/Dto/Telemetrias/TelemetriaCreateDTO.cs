using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.Telemetrias
{
    public class TelemetriaCreateDTO
    {
        [Required(ErrorMessage = "SensorId é obrigatório")]
        public int SensorId { get; set; }

        [Range(0, 100, ErrorMessage = "NivelOcupacao deve estar entre 0 e 100")]
        public int? NivelOcupacao { get; set; }

        [Range(0, 100, ErrorMessage = "Bateria deve estar entre 0 e 100")]
        public int? Bateria { get; set; }

        [Range(-50, 100, ErrorMessage = "Temperatura deve estar entre -50 e 100")]
        public decimal? Temperatura { get; set; }

        [Range(0, 60, ErrorMessage = "TensaoBateria deve estar entre 0 e 60 V")]
        public decimal? TensaoBateria { get; set; }

        [Range(0, 60, ErrorMessage = "TensaoPainel deve estar entre 0 e 60 V")]
        public decimal? TensaoPainel { get; set; }

        [Range(0, 100000, ErrorMessage = "CorrentePainel deve estar entre 0 e 100000 mA")]
        public decimal? CorrentePainel { get; set; }

        public bool? Carregando { get; set; }

        public DateTime? Momento { get; set; }

        /// <summary>
        /// Dados brutos em JSON para debug e análise futura
        /// </summary>
        public string? DadosBrutos { get; set; }
    }
}
