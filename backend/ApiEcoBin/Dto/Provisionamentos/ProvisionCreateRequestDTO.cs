namespace ApiEcoBin.Dto.Provisionamentos
{
    public class ProvisionCreateRequestDTO
    {
        public int SensorId { get; set; }
        public int UsuarioId { get; set; }
        public int ExpiracaoDias { get; set; } = 7; // Padrão 7 dias
    }
}
