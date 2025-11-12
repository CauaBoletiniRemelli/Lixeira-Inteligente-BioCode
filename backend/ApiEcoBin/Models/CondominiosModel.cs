using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("CONdominios")]
    public class CondominiosModel
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [Column("CONNome")]
        [MaxLength(100)]
        public string? Nome { get; set; }

        [Column("CONEndereco")]
        [MaxLength(255)]
        public string? Endereco { get; set; }

        [Column("CONCep")]
        [MaxLength(9)]
        public string? Cep { get; set; }

        [Column("CONCriadoEm")]
        public DateTime? CriadoEm { get; set; } = DateTime.Now;

        [Column("CONAtivo")]
        public bool? Ativo { get; set; }

        [JsonIgnore]
        public virtual ICollection<SensoresModel> Sensores { get; set; } = new List<SensoresModel>();
    }
}

