using ApiEcoBin.Data;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiEcoBin.Services.Condominio
{
    public class CondominioService(AppDbContext appDbContext) : ICondominioInterface
    {
        private readonly AppDbContext _context = appDbContext;
        public async Task<ResponseModel<List<CondominiosModel>>> GetCondominios()
        {
            ResponseModel<List<CondominiosModel>> response = new();

            try
            {
                List<CondominiosModel> condominios = await _context.Condominios.ToListAsync();

                if (condominios.Count > 0)
                {
                    response.Dados = condominios;
                    response.Mensagem = "Condomínios encontrados com sucesso.";
                    response.Status = true;
                    return response;
                }

                response.Mensagem = "Nenhum condomínio encontrado.";
                response.Status = true;
                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }

        public async Task<ResponseModel<CondominiosModel>> PostCondominio(CondominiosModel condominio)
        {
            ResponseModel<CondominiosModel> response = new();
            try
            {
                condominio.CriadoEm = DateTime.Now;
                _context.Condominios.Add(condominio);

                await _context.SaveChangesAsync();

                response.Dados = condominio;
                response.Mensagem = "Condomínio criado com sucesso.";
                response.Status = true;

                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }
    }
}
