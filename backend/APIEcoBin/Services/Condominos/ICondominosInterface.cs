using ApiEcoBin.Dto.Condominos;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Condominos
{
    public interface ICondominosInterface
    {
        Task<ResponseModel<List<StatusLixeiraDTO>>> GetStatusLixeirasAsync(int condominioId);
        Task<ResponseModel<ImpactoCondominoDTO>> GetImpactoMesAsync(int condominioId);
        Task<ResponseModel<List<UltimaColetaDTO>>> GetUltimasColetasAsync(int condominioId, int limite = 10);
        Task<ResponseModel<HomeCondominoDTO>> GetHomeAsync(int condominioId);
    }
}
