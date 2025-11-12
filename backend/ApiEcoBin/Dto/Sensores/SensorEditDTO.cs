namespace ApiEcoBin.Dto.Sensores
{
    public class SensorEditDTO
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public int? Status { get; set; }
        public int? CondominioId { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }
}
