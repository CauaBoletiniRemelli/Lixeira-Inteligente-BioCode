namespace ApiEcoBin.Dto.Telemetrias
{
    public class TelemetriaResponseDTO
    {
        public int Id { get; set; }
        public int SensorId { get; set; }
        public DateTime Momento { get; set; }
        public int? NivelOcupacao { get; set; }
        public bool AlertaGerado { get; set; }
        public string? Mensagem { get; set; }
    }
}
