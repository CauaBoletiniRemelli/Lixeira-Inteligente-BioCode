using Microsoft.EntityFrameworkCore;
using ApiEcoBin.Models;

namespace ApiEcoBin.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<UsuariosModel> Usuarios { get; set; }
        public DbSet<CondominiosModel> Condominios { get; set; }
        public DbSet<TelemetriasModel> Telemetrias { get; set; }
        public DbSet<SensoresModel> Sensores { get; set; }
        public DbSet<ProvisionamentosModel> Provisionamentos { get; set; } 
        public DbSet<RefreshTokensModel> RefreshTokens { get; set; }
        public DbSet<ExpoTokensModel> ExpoTokens { get; set; }
        public DbSet<NotificacoesModel> Notificacoes { get; set; }
        public DbSet<ProvisionSession> ProvisionSessions { get; set; }
    }
}
