// Dto/Provisionamentos/ProvisionActivateRequestDTO.cs
public class ProvisionActivateRequestDTO
{
    public string ProvisionId { get; set; } = string.Empty; 
    public string DeviceId { get; set; } = string.Empty;    
    public string Token { get; set; } = string.Empty;    

    public int CondominioId { get; set; }              
    public string? NomeSensor { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public ApiEcoBin.Enums.TipoLixeira? TipoLixeira { get; set; }
    public decimal? CapacidadeLitros { get; set; }

    public int? UsuarioId { get; set; }
    
    public string WifiSSID { get; set; } = string.Empty;
    public string WifiPassword { get; set; } = string.Empty;
}
