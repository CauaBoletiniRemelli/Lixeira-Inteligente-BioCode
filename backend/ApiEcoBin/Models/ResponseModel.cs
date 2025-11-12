using Microsoft.Identity.Client;

namespace ApiEcoBin.Models
{
    public class ResponseModel<T>
    {
        public T? Dados { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public bool Status { get; set; } = true;
        public byte[]? QrCodeBytes { get; set; }
        public string? SessionToken { get; set; }
        public DateTime? SessionExpires { get; set; }
        }
}
