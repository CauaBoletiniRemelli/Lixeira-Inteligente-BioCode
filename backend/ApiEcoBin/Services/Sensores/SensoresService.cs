using ApiEcoBin.Data;
using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Services.Sensores
{
    public class SensoresService(AppDbContext appDbContext) : ISensoresInterface
    {
        private readonly AppDbContext _context = appDbContext;

        public async Task<ResponseModel<SensoresModel>> CreateSensor(SensorCreateDTO sensorCreateDTO)
        {
            ResponseModel<SensoresModel> response = new();

            try
            {
                SensoresModel sensor = new SensoresModel()
                {
                    DeviceId = sensorCreateDTO.DeviceId,
                    DeviceKey = sensorCreateDTO.DeviceKey,
                    CriadoEm = DateTime.Now,
                    CondominioId = sensorCreateDTO.CondominioId,
                    Status = sensorCreateDTO.Status,
                };

                _context.Sensores.Add(sensor);
                await _context.SaveChangesAsync();

                response.Dados = sensor;
                response.Mensagem = "Sensor criado com sucesso.";
                response.Status = true;

                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }

        public async Task<ResponseModel<List<SensoresModel>>> DeleteSensor(int idSensor)
        {
            ResponseModel<List<SensoresModel>> response = new();

            try
            {
                SensoresModel? sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == idSensor);

                if (sensor == null)
                {
                    response.Mensagem = "Sensor não encontrado.";
                    response.Status = false;
                    return response;
                }

                _context.Sensores.Remove(sensor);
                await _context.SaveChangesAsync();

                response.Mensagem = "Sensor deletado com sucesso.";
                response.Status = true;
                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }

        public async Task<ResponseModel<List<SensoresModel>>> GetSensores()
        {
            ResponseModel<List<SensoresModel>> response = new();

            try
            {
                List<SensoresModel> sensores = await _context.Sensores.ToListAsync();

                if (sensores == null || sensores.Count == 0)
                {
                    response.Mensagem = "Nenhum sensor encontrado.";
                    response.Status = false;
                    return response;
                }

                response.Dados = sensores;
                response.Mensagem = "Sensores recuperados com sucesso.";
                response.Status = true;
                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }

        public async Task<ResponseModel<SensoresModel>> UpdateSensor(SensorEditDTO sensorEditDTO)
        {
            ResponseModel<SensoresModel> response = new();

            try
            {
                SensoresModel? sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == sensorEditDTO.Id);

                if (sensor == null)
                {
                    response.Mensagem = "Sensor não encontrado.";
                    response.Status = true;
                    return response;
                }

                if (sensorEditDTO.DeviceId != null || sensor.DeviceId != sensorEditDTO.DeviceId)
                    sensor.DeviceId = sensorEditDTO.DeviceId;

                if (sensorEditDTO.DeviceKey != null || sensor.DeviceKey != sensorEditDTO.DeviceKey)
                    sensor.DeviceKey = sensorEditDTO.DeviceKey;

                if (sensorEditDTO.Status.HasValue && sensor.Status != sensorEditDTO.Status.Value)
                    sensor.Status = sensorEditDTO.Status.Value;

                if (sensorEditDTO.CondominioId != null || sensor.CondominioId != sensorEditDTO.CondominioId)
                    sensor.CondominioId = sensorEditDTO.CondominioId;

                _context.Sensores.Update(sensor);
                await _context.SaveChangesAsync();

                response.Dados = sensor;
                response.Mensagem = "Sensor atualizado com sucesso.";
                response.Status = true;

                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;

                return response;
            }
        }
    }
}
