namespace ApiEcoBin.Dto.Telemetrias
{
    public class TelemetriaListDTO
    {
        public int Id { get; set; }
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public DateTime? Momento { get; set; }
        public int? NivelOcupacao { get; set; }
        public int? Bateria { get; set; }
        public decimal? Temperatura { get; set; }
    }
}
