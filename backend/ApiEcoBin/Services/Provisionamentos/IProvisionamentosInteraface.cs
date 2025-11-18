using ApiEcoBin.Dto.Devices;
using ApiEcoBin.Dto.Provisionamentos;
using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Provisionamentos
{
    public interface IProvisionamentosInteraface
    {
        Task<ResponseModel<ProvisionamentosModel>> CreateProvisionamentoAsync(ProvisionCreateRequestDTO dto);
        Task<ResponseModel<ProvisionamentosModel>> CreateProvisionamentoComSensorAsync(ProvisionCreateWithSensorDTO dto);
        Task<ResponseModel<List<ProvisionamentosModel>>> GetProvisionamentosAsync();
        Task<ResponseModel<ProvisionamentosModel>> GetProvisionamentoByIdAsync(int id);
        Task<ResponseModel<ProvisionQrResponseDTO>> CreateQrCodeProvisionamentoAsync(int provisionId);
        Task<ResponseModel<ProvisionActivateResponseDTO>> ActivateProvisionAsync(ProvisionActivateRequestDTO dto, int? userIdFromClaim = null);
        Task<ResponseModel<bool>> ConfirmDeviceConfigAsync(string deviceId, Dto.Devices.ConfirmConfigDTO dto);
        Task<ResponseModel<WifiCredentialsResponseDTO>> GetWifiCredentialsAsync(string deviceId, string sessionToken);
        Task<ResponseModel<object>> AssignWifiToSessionAsync(string sessionToken, AssignWifiRequestDTO dto);
    }
}
