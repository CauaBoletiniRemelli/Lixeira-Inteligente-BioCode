using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Dto.Condominios
{
    public class CondominiosCreateDTO
    {
        public string? Nome { get; set; }

        public string? Endereco { get; set; }

        public bool? Ativo { get; set; }
    }
}
