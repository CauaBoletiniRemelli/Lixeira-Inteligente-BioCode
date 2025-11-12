namespace ApiEcoBin.Dto.Telemetrias
{
    public class TelemetriaStatsDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public int TotalLeituras { get; set; }
        public decimal? MediaOcupacao { get; set; }
        public decimal? MediaTemperatura { get; set; }
        public int? NivelAtual { get; set; }
        public DateTime? UltimaLeitura { get; set; }
        public int? AlertasCheio { get; set; }
    }
}
