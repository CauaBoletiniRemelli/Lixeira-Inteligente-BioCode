namespace ApiEcoBin.Dto.Devices
{
    /// <summary>
    /// DTO para confirmação de configuração do dispositivo
    /// </summary>
    public class ConfirmConfigDTO
    {

        public string SessionToken { get; set; } = string.Empty;

        public bool WifiConnected { get; set; }

        public string? Message { get; set; }
    }
}
