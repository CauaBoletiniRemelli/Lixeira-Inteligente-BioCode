using ApiEcoBin.Dto.OleoColetas;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.OleoColetas
{
    public interface IOleoColetasInterface
    {
        Task<ResponseModel<OleoColetaDTO>> CreateAsync(OleoColetaCreateDTO dto, int? usuarioId);
        Task<ResponseModel<List<OleoColetaDTO>>> GetByCondominioAsync(int condominioId, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<ResponseModel<bool>> DeleteAsync(int id);
    }
}
