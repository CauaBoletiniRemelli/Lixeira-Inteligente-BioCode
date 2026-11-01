namespace ApiEcoBin.Dto.Condominos
{
    public class StatusLixeiraDTO
    {
        public int SensorId { get; set; }
        public string? Nome { get; set; }
        public string? TipoLixeira { get; set; }
        public int NivelOcupacao { get; set; }
        public string StatusCor { get; set; } = "verde";
        public string StatusLabel { get; set; } = "Livre";
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime? UltimaLeitura { get; set; }
    }

    public class ImpactoCondominoDTO
    {
        public decimal KgReciclados { get; set; }
        public decimal Co2Evitado { get; set; }
        public decimal ArvoresSalvas { get; set; }
        public string Periodo { get; set; } = string.Empty;
    }

    public class UltimaColetaDTO
    {
        public int SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public DateTime? DataColeta { get; set; }
    }

    public class HomeCondominoDTO
    {
        public List<StatusLixeiraDTO> Lixeiras { get; set; } = [];
        public ImpactoCondominoDTO ImpactoMes { get; set; } = new();
        public List<UltimaColetaDTO> UltimasColetas { get; set; } = [];
    }
}
