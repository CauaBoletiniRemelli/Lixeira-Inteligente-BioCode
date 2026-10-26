using ApiEcoBin.Dto.ExpoTokens;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.ExpoTokens
{
    public interface IExpoTokensInterface
    {
        Task<ResponseModel<ExpoTokensModel>> SalvarTokenAsync(ExpoTokenCreateDTO dto);
        Task<ResponseModel<List<ExpoTokensModel>>> ListarTokensPorUsuarioAsync(int usuarioId);
        Task<ResponseModel<ExpoTokensModel>> DesativarTokenAsync(int tokenId);
        Task<ResponseModel<int>> DesativarTokenPorPlayerIdAsync(string playerId);
        Task<ResponseModel<int>> LimparNotificacoesUsuarioAsync(int usuarioId);
        Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaTodosAsync(NotificacaoCreateDTO dto);
        Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaUsuariosAsync(NotificacaoEnviarDTO dto);
        Task<ResponseModel<NotificacoesModel>> EnviarNotificacaoParaUsuarioAsync(int usuarioId, NotificacaoCreateDTO dto);
        Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaCondominioAsync(int condominioId, NotificacaoCreateDTO dto);
        Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaCondominioTipoAsync(NotificacaoCondominioTipoDTO dto);
        Task<ResponseModel<List<NotificacoesModel>>> ListarNotificacoesPorUsuarioAsync(int usuarioId);
        Task<ResponseModel<List<NotificacoesModel>>> ListarNotificacoesNaoLidasAsync(int usuarioId);
        Task<ResponseModel<NotificacoesModel>> MarcarComoLidaAsync(int notificacaoId);
        Task<ResponseModel<bool>> MarcarTodasComoLidasAsync(int usuarioId);
        Task<ResponseModel<int>> DeletarNotificacoesAntigasAsync(DateTime dataLimite);
    }
}