using ApiEcoBin.Dto.Telemetrias;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Telemetrias
{
    public interface ITelemetriasInterface
    {
        Task<ResponseModel<TelemetriaResponseDTO>> CreateTelemetriaAsync(TelemetriaCreateDTO dto);

        Task<ResponseModel<TelemetriaResponseDTO>> CreateTelemetriaArduinoAsync(TelemetriaArduinoDTO dto);

        Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasAsync();

        Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasFiltroAsync(TelemetriaFiltroDTO filtro);

        Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasBySensorAsync(int sensorId, int limit = 100);

        Task<ResponseModel<TelemetriasModel>> GetUltimaTelemetriaAsync(int sensorId);
        Task<ResponseModel<List<TelemetriasModel>>> GetTelemetriasByCondominioAsync(int condominioId);

        Task<ResponseModel<TelemetriaStatsDTO>> GetEstatisticasSensorAsync(int sensorId, DateTime? dataInicio = null, DateTime? dataFim = null);

        Task<ResponseModel<List<TelemetriaStatsDTO>>> GetEstatisticasCondominioAsync(int condominioId);
        Task<ResponseModel<int>> DeleteTelemetriasAntigasAsync(DateTime dataLimite);
    }
}
