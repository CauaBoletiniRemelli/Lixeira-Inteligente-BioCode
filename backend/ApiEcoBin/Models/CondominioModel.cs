using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApiEcoBin.Models
{
    [Table("CONdominios")]
    public class CondominioModel
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

        [Column("CONCriadoEm")]
        public DateTime? CriadoEm { get; set; } = DateTime.Now;

        [JsonIgnore]
        public virtual ICollection<SensorModel> Sensores { get; set; } = new List<SensorModel>();
    }
}

