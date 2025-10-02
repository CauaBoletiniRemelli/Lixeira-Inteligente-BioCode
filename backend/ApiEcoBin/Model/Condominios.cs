using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiEcoBin.Model
{
    [Table("condominios")]
    public class Condominios
    {
        [Key]
        public int id { get; private set; }
        
        [Required]
        [MaxLength(100)]
        public string nome { get; private set; }
        
        [MaxLength(255)]
        public string? endereco { get; private set; }
        
        [Column("criado_em")]
        public DateTime criado_em { get; private set; }

        public Condominios(string nome, string? endereco = null)
        {
            this.nome = nome ?? throw new ArgumentNullException(nameof(nome));
            this.endereco = endereco;
            this.criado_em = DateTime.UtcNow;
        }

        private Condominios() 
        {
            nome = string.Empty;
        }
    }
}
