namespace ApiEcoBin.Dto.Condominios
{
    public class CondominioEditDTO
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public string? Endereco { get; set; }
        public string? CEP { get; set; }
        public bool Ativo { get; set; }
    }
}
