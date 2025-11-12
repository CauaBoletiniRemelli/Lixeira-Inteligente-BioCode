using ApiEcoBin.Data;
using ApiEcoBin.Enums;
using ApiEcoBin.Services;
using ApiEcoBin.Services.Auth;
using ApiEcoBin.Services.Condominio;
using ApiEcoBin.Services.ExpoTokens;
using ApiEcoBin.Services.PasswordHash;
using ApiEcoBin.Services.Provisionamentos;
using ApiEcoBin.Services.Sensores;
using ApiEcoBin.Services.Telemetrias;
using ApiEcoBin.Services.Usuario;
using ApiEcoBin.Services.Usuarios;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

namespace ApiEcoBin
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen( c =>
            {
                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            },
                            Scheme = "oauth2",
                            Name = "Bearer",
                            In = ParameterLocation.Header
                        },
                        new List<string>()
                    }
                });
            });

            builder.Services.AddScoped<IUsuarioInterface, UsuarioService>();
            builder.Services.AddScoped<ICondominioInterface, CondominioService>();
            builder.Services.AddScoped<ISensoresInterface, SensoresService>();
            builder.Services.AddScoped<IProvisionamentosInteraface, ProvisionamentosService>();
            builder.Services.AddScoped<IAuthInterface, AuthService>();
            builder.Services.AddScoped<IPasswordHashService, PasswordHashService>();
            builder.Services.AddSingleton<TokenService>();
            builder.Services.AddScoped<IExpoTokensInterface, ExpoTokensService>();
            builder.Services.AddScoped<ITelemetriasInterface, TelemetriasService>();
            builder.Services.AddHttpClient(); 

            builder.Services.AddAuthorizationBuilder()
                .AddPolicy("AdminOnly", policy => policy.RequireClaim("Tipo", ((int)TipoUsuario.Administrador).ToString()))
                .AddPolicy("AppOnly", policy => policy.RequireClaim("Tipo",
                    ((int)TipoUsuario.Administrador).ToString(),
                    ((int)TipoUsuario.Aplicativo).ToString()))
                .AddPolicy("ArduinoOnly", policy => policy.RequireClaim("Tipo", ((int)TipoUsuario.Arduino).ToString()));

            Key.Secret = builder.Configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key não configurada");

            byte[] key = Encoding.ASCII.GetBytes(Key.Secret);

            builder.Services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(x =>
            {
                x.RequireHttpsMetadata = false;
                x.SaveToken = true;
                x.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false
                };
            });

            builder.Services.AddDbContext<AppDbContext>(options =>
            {
                var connectionString = builder.Environment.IsDevelopment()
                    ? builder.Configuration.GetConnectionString("LocalConnection")
                    : builder.Configuration.GetConnectionString("EcoBinConnectionString");

                options.UseSqlServer(connectionString);
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var logger = services.GetRequiredService<ILogger<Program>>();

                try
                {
                    var dbContext = services.GetRequiredService<AppDbContext>();

                    logger.LogInformation("Verificando migrations pendentes...");
                    var pendingMigrations = dbContext.Database.GetPendingMigrations().ToList();

                    if (pendingMigrations.Any())
                    {
                        logger.LogWarning("Aplicando {Count} migrations: {Migrations}",
                            pendingMigrations.Count,
                            string.Join(", ", pendingMigrations));

                        dbContext.Database.Migrate();

                        logger.LogInformation("✅ Migrations aplicadas com sucesso!");
                    }
                    else
                    {
                        logger.LogInformation("✅ Nenhuma migration pendente. Banco de dados está atualizado.");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ Erro ao aplicar migrations: {Message}", ex.Message);

                    // ⚠️ Descomente a linha abaixo se quiser impedir a API de subir caso migrations falhem
                    // throw;
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
