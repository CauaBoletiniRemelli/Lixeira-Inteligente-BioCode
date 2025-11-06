namespace ApiEcoBin.Dto.Sensores
{
    public class SensorActivateDTO
    {
        public string DeviceId { get; set; } = string.Empty;
        public string? DeviceKey { get; set; }
        public int SessionId { get; set; }
        public string SessionToken { get; set; } = string.Empty;
        public string? NomeSensor { get; set; }
        public int? CondominioId { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        public string WifiSSID { get; set; } = string.Empty;
        public string WifiPassword { get; set; } = string.Empty;
    }
}
