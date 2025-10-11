using ApiEcoBin.Models;

namespace ApiEcoBin.Services.Condominio
{
    public interface ICondominioInterface
    {
        Task<ResponseModel<List<CondominiosModel>>> GetCondominios();
        Task<ResponseModel<CondominiosModel>> PostCondominio(CondominiosModel condominio);
    }
}
