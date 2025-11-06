namespace ApiEcoBin.Dto.Provisionamentos
{
    public class ProvisionActivateResponseDTO
    {
        public bool Success { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public int SensorId { get; set; }
        public string SessionToken { get; set; } = string.Empty;
        public DateTime SessionExpires { get; set; }
        public string Message { get; set; } = string.Empty;
    }

}
