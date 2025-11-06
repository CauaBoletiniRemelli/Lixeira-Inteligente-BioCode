namespace ApiEcoBin.Dto.Provisionamentos
{
    public class ConfirmConfigDTO
    {
        public string SessionToken { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? Message { get; set; }
    }
}