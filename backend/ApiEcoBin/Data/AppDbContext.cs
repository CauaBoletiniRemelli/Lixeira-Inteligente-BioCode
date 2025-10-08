using Microsoft.EntityFrameworkCore;
using ApiEcoBin.Models;

namespace ApiEcoBin.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<UsuarioModel> Usuarios { get; set; }
        public DbSet<CondominioModel> Condominios { get; set; }
        public DbSet<TelemetriaModel> Telemetrias { get; set; }
        public DbSet<SensorModel> Sensores { get; set; }
        public DbSet<ProvisionamentoModel> Provisionamentos { get; set; } 
    }
}
