using ApiEcoBin.Model;
using ApiEcoBin.Model.Enums;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Infraestrutura
{
    public class ConnectionContext(DbContextOptions<ConnectionContext> options) : DbContext(options)
    {
        public DbSet<Usuarios> Usuarios { get; set; }
        public DbSet<Condominios> Condominios { get; set; }
        public DbSet<Sensores> Sensores { get; set; }
        public DbSet<Provisionamentos> Provisionamentos { get; set; }
        public DbSet<Telemetrias> Telemetrias { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseNpgsql(
                    "Server=localhost;" +
                    "Port=5432;Database=ecobin_biocode;" +
                    "User Id=postgres;" +
                    "Password=@Lesicadu2;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<Usuarios>(entity =>
            {
                entity.HasKey(e => e.id);
                entity.Property(e => e.criado_em)
                      .HasDefaultValueSql("now()");
                entity.Property(e => e.tipo)
                      .HasDefaultValue(UsuarioTipo.cliente);
                entity.HasIndex(e => e.email).IsUnique();
            });

            modelBuilder.Entity<Condominios>(entity =>
            {
                entity.HasKey(e => e.id);
                entity.Property(e => e.criado_em)
                      .HasDefaultValueSql("now()");
            });

            modelBuilder.Entity<Sensores>(entity =>
            {
                entity.HasKey(e => e.id);
                entity.Property(e => e.criado_em)
                      .HasDefaultValueSql("now()");
                entity.Property(e => e.status)
                      .HasDefaultValue(SensorStatus.inativo);
                entity.HasIndex(e => e.device_id).IsUnique();
            });

            modelBuilder.Entity<Provisionamentos>(entity =>
            {
                entity.HasKey(e => e.id);
                entity.Property(e => e.criado_em)
                      .HasDefaultValueSql("now()");
                entity.Property(e => e.usado)
                      .HasDefaultValue(false);
            });

            modelBuilder.Entity<Telemetrias>(entity =>
            {
                entity.HasKey(e => e.id);
                entity.Property(e => e.momento)
                      .HasDefaultValueSql("now()");
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
