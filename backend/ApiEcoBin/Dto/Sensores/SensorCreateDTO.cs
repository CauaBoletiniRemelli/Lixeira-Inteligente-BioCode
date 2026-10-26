using ApiEcoBin.Enums;

namespace ApiEcoBin.Dto.Sensores
{
    public class SensorCreateDTO
    {
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceKey { get; set; } = string.Empty;
        public int? CondominioId { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Nome { get; set; }
        public TipoLixeira Tipo { get; set; } = TipoLixeira.NaoDefinido;
        public decimal? CapacidadeLitros { get; set; }
    }
}
