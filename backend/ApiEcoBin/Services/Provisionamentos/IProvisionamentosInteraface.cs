using ApiEcoBin.Dto.Devices;
using ApiEcoBin.Dto.Provisionamentos;
using ApiEcoBin.Dto.Sensores;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Provisionamentos
{
    public interface IProvisionamentosInteraface
    {
        Task<ResponseModel<ProvisionamentosModel>> CreateProvisionamentoAsync(ProvisionCreateRequestDTO dto);
        Task<ResponseModel<ProvisionQrResponseDTO>> CreateQrCodeProvisionamentoAsync(int provisionId);
        Task<ResponseModel<ProvisionActivateResponseDTO>> ActivateProvisionAsync(ProvisionActivateRequestDTO dto, int? userIdFromClaim = null);
        Task<ResponseModel<bool>> ConfirmDeviceConfigAsync(string deviceId, Dto.Devices.ConfirmConfigDTO dto);
        Task<ResponseModel<WifiCredentialsResponseDTO>> GetWifiCredentialsAsync(string deviceId, string sessionToken);
    }
}
