using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Dto.OleoColetas
{
    public class OleoColetaCreateDTO
    {
        [Required(ErrorMessage = "CondominioId é obrigatório")]
        public int CondominioId { get; set; }

        public int? SensorId { get; set; }

        [Range(0.1, 10000, ErrorMessage = "Litros deve estar entre 0,1 e 10000")]
        public decimal Litros { get; set; }

        [MaxLength(150)]
        public string? Destino { get; set; }

        [MaxLength(500)]
        public string? Observacao { get; set; }

        public DateTime? DataColeta { get; set; }
    }

    public class OleoColetaDTO
    {
        public int Id { get; set; }
        public int CondominioId { get; set; }
        public int? SensorId { get; set; }
        public string? NomeSensor { get; set; }
        public decimal Litros { get; set; }
        public string? Destino { get; set; }
        public string? Observacao { get; set; }
        public DateTime DataColeta { get; set; }
        public string? RegistradoPor { get; set; }
    }
}
