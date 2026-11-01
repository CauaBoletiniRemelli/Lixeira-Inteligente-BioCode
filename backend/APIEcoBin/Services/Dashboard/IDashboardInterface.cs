using ApiEcoBin.Dto.Dashboard;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Dashboard
{
    public interface IDashboardInterface
    {
        Task<ResponseModel<List<NivelPorPeriodoDTO>>> GetNivelAoLongoDoTempoAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null, GranularidadePeriodo granularidade = GranularidadePeriodo.Dia);
        Task<ResponseModel<VolumeReciclavelDTO>> GetVolumeReciclavelAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<List<RankingLixeiraDTO>>> GetRankingLixeirasAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<List<EvolucaoMensalDTO>>> GetEvolucaoMensalAsync(int condominioId, int meses = 6);
        Task<ResponseModel<List<EficienciaColetaDTO>>> GetEficienciaColetaAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<List<TempoMedioEnchimentoDTO>>> GetTempoMedioEnchimentoAsync(int condominioId);
        Task<ResponseModel<AlertasOcorrenciasDTO>> GetAlertasOcorrenciasAsync(int condominioId);
        Task<ResponseModel<ImpactoAmbientalDTO>> GetImpactoAmbientalAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<List<UsoPorDiaSemanaDTO>>> GetUsoPorDiaSemanaAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<EconomiaEstimadaDTO>> GetEconomiaEstimadaAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null, decimal custoMedioColeta = 150m);
        Task<ResponseModel<EnergiaSolarDTO>> GetEnergiaSolarAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<OleoResumoDTO>> GetOleoResumoAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<PainelColetorDTO>> GetPainelColetorAsync(int condominioId);
        Task<ResponseModel<DashboardGeralDTO>> GetDashboardGeralAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
    }
}