using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Sensores
{
    public interface ISensoresInterface
    {
        Task<ResponseModel<List<SensoresModel>>> GetSensores();
        Task<ResponseModel<SensoresModel>> CreateSensor(SensorCreateDTO sensorCreateDTO);
        Task<ResponseModel<SensoresModel>> UpdateSensor(SensorEditDTO sensorEditDTO);
        Task<ResponseModel<List<SensoresModel>>> DeleteSensor(int idSensor);
    }
}
