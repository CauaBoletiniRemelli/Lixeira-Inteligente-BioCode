namespace ApiEcoBin.Dto.Sensores
{
    public class SensorEditDTO
    {
        public int Id { get; set; }
        public string? DeviceId { get; set; }

        public string? DeviceKey { get; set; }

        public int? Status { get; set; }

        public int? CondominioId { get; set; }
    }
}
