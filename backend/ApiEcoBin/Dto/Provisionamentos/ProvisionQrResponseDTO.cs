namespace ApiEcoBin.Dto.Provisionamentos
{
    public class ProvisionQrResponseDTO
    {
        public byte[] QrBytes { get; set; } = Array.Empty<byte>();
        public string MediaType { get; set; } = "image/png";
    }
}
