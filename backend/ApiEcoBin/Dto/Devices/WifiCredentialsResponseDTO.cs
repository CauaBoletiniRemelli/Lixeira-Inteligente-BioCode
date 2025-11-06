namespace ApiEcoBin.Dto.Devices
{
    public class WifiCredentialsResponseDTO
    {
        public string SSID { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public DateTime SessionExpires { get; set; }
        public string DeviceId { get; set; } = string.Empty;
    }
}
