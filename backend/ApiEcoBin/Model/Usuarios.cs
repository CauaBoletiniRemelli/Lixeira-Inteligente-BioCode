using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiEcoBin.Model.Enums;

namespace ApiEcoBin.Model
{
    [Table("usuarios")]
    public class Usuarios
    {
        [Key]
        public int id { get; private set; }
        
        [Required]
        [MaxLength(100)]
        public string nome { get; private set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string email { get; private set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        public string senha_hash { get; private set; } = string.Empty;
        
        [Column(TypeName = "usuario_tipo")]
        public int tipo { get; private set; }
        
        [Column("criado_em")]
        public DateTime criado_em { get; private set; }

        public Usuarios(string nome, string email, string senha_hash, int tipo)
        {
            this.nome = nome ?? throw new ArgumentNullException(nameof(nome));
            this.email = email ?? throw new ArgumentNullException(nameof(email));
            this.senha_hash = senha_hash ?? throw new ArgumentNullException(nameof(senha_hash));
            this.tipo = tipo;
            this.criado_em = DateTime.UtcNow;
        }

        private Usuarios() { }
    }
}
