namespace ApiEcoBin.Dto.Telemetrias
{
    public class TelemetriaFiltroDTO
    {
        public int? SensorId { get; set; }
        public int? CondominioId { get; set; }
        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public int? NivelMinimoOcupacao { get; set; }
        public int? NivelMaximoOcupacao { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 100;
    }
}
