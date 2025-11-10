using ApiEcoBin.Data;
using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Services.Sensores
{
    public class SensoresService : ISensoresInterface
    {
        private readonly AppDbContext _context;

        public SensoresService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResponseModel<SensoresModel>> CreateSensorAsync(SensorCreateDTO dto)
        {
            var response = new ResponseModel<SensoresModel>();

            try
            {
                var sensor = new SensoresModel
                {
                    DeviceId = dto.DeviceId,
                    DeviceKey = dto.DeviceKey ?? Guid.NewGuid().ToString("N"),
                    CondominioId = dto.CondominioId,
                    Nome = dto.Nome,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    Status = 0,
                    CriadoEm = DateTime.UtcNow
                };

                _context.Sensores.Add(sensor);
                await _context.SaveChangesAsync();

                response.Status = true;
                response.Mensagem = "Sensor criado com sucesso.";
                response.Dados = sensor;
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
            }

            return response;
        }

        public async Task<ResponseModel<SensoresModel>> UpdateSensorAsync(SensorEditDTO dto)
        {
            var sensor = await _context.Sensores.FindAsync(dto.Id);

            if (sensor == null)
                return new ResponseModel<SensoresModel> { Status = false, Mensagem = "Sensor não encontrado." };

            if (!string.IsNullOrWhiteSpace(dto.Nome)) sensor.Nome = dto.Nome;
            if (dto.Status.HasValue) sensor.Status = dto.Status.Value;
            if (dto.CondominioId.HasValue) sensor.CondominioId = dto.CondominioId.Value;
            if (dto.Latitude.HasValue) sensor.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) sensor.Longitude = dto.Longitude.Value;

            await _context.SaveChangesAsync();

            return new ResponseModel<SensoresModel>
            {
                Status = true,
                Mensagem = "Sensor atualizado com sucesso.",
                Dados = sensor
            };
        }

        public async Task<ResponseModel<SensoresModel>> UpdateSensorLocaleAsync(SensorUpdateLocaleDTO dto)
        {
            var sensor = await _context.Sensores.FindAsync(dto.Id);

            if (sensor == null)
                return new ResponseModel<SensoresModel> { Status = false, Mensagem = "Sensor não encontrado." };

            if (dto.Latitude.HasValue) sensor.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) sensor.Longitude = dto.Longitude.Value;

           _context.Sensores.Update(sensor);

            await _context.SaveChangesAsync();

            return new ResponseModel<SensoresModel>
            {
                Status = true,
                Mensagem = "Sensor atualizado com sucesso.",
                Dados = sensor
            };
        }

        public async Task<ResponseModel<List<SensoresModel>>> DeleteSensorAsync(int idSensor)
        {
            var sensor = await _context.Sensores.FindAsync(idSensor);

            if (sensor == null)
                return new ResponseModel<List<SensoresModel>> { Status = false, Mensagem = "Sensor não encontrado." };

            _context.Sensores.Remove(sensor);
            await _context.SaveChangesAsync();

            return new ResponseModel<List<SensoresModel>>
            {
                Status = true,
                Mensagem = "Sensor removido."
            };
        }

        public async Task<ResponseModel<List<SensoresModel>>> GetSensoresAsync()
        {
            var sensores = await _context.Sensores.ToListAsync();

            return new ResponseModel<List<SensoresModel>>
            {
                Status = true,
                Dados = sensores,
                Mensagem = "Lista de sensores retornada."
            };
        }

        public async Task<ResponseModel<List<SensoresModel>>> GetSensoresByCondominioAsync(int condominioId)
        {
            var sensores = await _context.Sensores
                .Where(s => s.CondominioId == condominioId)
                .ToListAsync();

            return new ResponseModel<List<SensoresModel>>
            {
                Status = true,
                Dados = sensores,
                Mensagem = "Sensores do condomínio retornados."
            };
        }

        public async Task<ResponseModel<SensoresModel>> GetSensorByDeviceIdAsync(string deviceId)
        {
            var sensor = await _context.Sensores
                .FirstOrDefaultAsync(s => s.DeviceId == deviceId);

            if (sensor == null)
                return new ResponseModel<SensoresModel> { Status = false, Mensagem = "Sensor não encontrado." };

            return new ResponseModel<SensoresModel>
            {
                Status = true,
                Dados = sensor
            };
        }
    }
}