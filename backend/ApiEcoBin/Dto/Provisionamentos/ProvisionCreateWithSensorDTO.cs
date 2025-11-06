namespace ApiEcoBin.Dto.Provisionamentos
{
    public class ProvisionCreateWithSensorDTO
    {
        public string NomeSensor { get; set; } = string.Empty;
        public int CondominioId { get; set; }
        
        public int UsuarioId { get; set; }
        public int ExpiracaoDias { get; set; } = 7;
    }
}
