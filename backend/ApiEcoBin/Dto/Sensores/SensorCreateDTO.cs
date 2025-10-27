namespace ApiEcoBin.Dto.Sensores
{
    public class SensorCreateDTO
    {
        public string? DeviceId { get; set; }

        public string? DeviceKey { get; set; }

        public int Status { get; set; } = 0;

        public int? CondominioId { get; set; }
    }
}
