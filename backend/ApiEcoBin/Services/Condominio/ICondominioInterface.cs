using ApiEcoBin.Dto.Condominios;
using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Condominio
{
    public interface ICondominioInterface
    {
        Task<ResponseModel<List<CondominiosModel>>> GetCondominios();
        Task<ResponseModel<CondominiosModel>> CreateCondominio(CondominiosCreateDTO condominio);
        Task<ResponseModel<CondominiosModel>> UpdateCondominio(CondominioEditDTO condominio);
        Task<ResponseModel<List<CondominiosModel>>> DeleteCondominio(int idCond);
    }
}
