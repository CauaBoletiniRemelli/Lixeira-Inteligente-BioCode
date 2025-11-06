using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Sensores
{
    public interface ISensoresInterface
    {
        Task<ResponseModel<SensoresModel>> CreateSensorAsync(SensorCreateDTO dto);

        Task<ResponseModel<SensoresModel>> UpdateSensorAsync(SensorEditDTO dto);
        Task<ResponseModel<List<SensoresModel>>> DeleteSensorAsync(int idSensor);

        Task<ResponseModel<List<SensoresModel>>> GetSensoresAsync();
        Task<ResponseModel<List<SensoresModel>>> GetSensoresByCondominioAsync(int condominioId);
        Task<ResponseModel<SensoresModel>> GetSensorByDeviceIdAsync(string deviceId);
    }
}
