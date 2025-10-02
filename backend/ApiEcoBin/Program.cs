using ApiEcoBin.Infraestrutura;
using ApiEcoBin.Model;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<ConnectionContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IEcoBin<Usuarios>, EcoBin<Usuarios>>();
builder.Services.AddScoped<IEcoBin<Condominios>, EcoBin<Condominios>>();
builder.Services.AddScoped<IEcoBin<Sensores>, EcoBin<Sensores>>();
builder.Services.AddScoped<IEcoBin<Provisionamentos>, EcoBin<Provisionamentos>>();
builder.Services.AddScoped<IEcoBin<Telemetrias>, EcoBin<Telemetrias>>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
