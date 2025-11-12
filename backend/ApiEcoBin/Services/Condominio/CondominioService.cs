using ApiEcoBin.Data;
using ApiEcoBin.Dto.Condominios;
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
                response.Status = false;
                return response;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
                return response;
            }
        }

        public async Task<ResponseModel<CondominiosModel>> CreateCondominio(CondominiosCreateDTO condominioCreateDTO)
        {
            ResponseModel<CondominiosModel> response = new();
            try
            {
                CondominiosModel condominio = new()
                {
                    CriadoEm = DateTime.Now,
                    Nome = condominioCreateDTO.Nome,
                    Endereco = condominioCreateDTO.Endereco,
                    Cep = condominioCreateDTO.CEP!.ToString(),
                    Ativo = condominioCreateDTO.Ativo,
                };

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

        public async Task<ResponseModel<CondominiosModel>> UpdateCondominio(CondominioEditDTO condominioEditDTO)
        {
            ResponseModel<CondominiosModel > response = new();

            try
            {
                CondominiosModel? condominio = await _context.Condominios.FirstOrDefaultAsync(condominio =>
                condominio.Id == condominioEditDTO.Id);

                if (condominio == null)
                {
                    response.Mensagem = "Nenhum condomínio localizado!";
                    response.Status = false;
                    return response;
                }

                if (!string.IsNullOrWhiteSpace(condominioEditDTO.Nome) || condominio.Nome != condominioEditDTO.Nome)
                    condominio.Nome = condominioEditDTO.Nome;

                if (!string.IsNullOrWhiteSpace(condominioEditDTO.Endereco) || condominio.Endereco != condominioEditDTO.Endereco)
                    condominio.Endereco = condominioEditDTO.Endereco;

                if (!string.IsNullOrWhiteSpace(condominioEditDTO.CEP!.ToString()) || condominio.Cep != condominioEditDTO.CEP.ToString())
                    condominio.Cep = condominioEditDTO.CEP.ToString();

                if (condominio.Ativo != condominioEditDTO.Ativo)
                    condominio.Ativo = condominioEditDTO.Ativo;

                _context.Update(condominio);
                await _context.SaveChangesAsync();

                response.Dados = condominio;
                response.Mensagem = "Condomínio atualizado com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }

            return response;
        }

        public async Task<ResponseModel<List<CondominiosModel>>> DeleteCondominio(int idCond)
        {
            ResponseModel<List<CondominiosModel>> response = new();

            try
            {
                CondominiosModel? condominio = await _context.Condominios.FirstOrDefaultAsync(cond => cond.Id == idCond);

                if (condominio == null)
                {
                    response.Mensagem = "Nenhum condomínio localizado!";
                    response.Status = false;
                    return response;
                }

                _context.Condominios.Remove(condominio);
                await _context.SaveChangesAsync();

                response.Dados = await _context.Condominios.ToListAsync();
                response.Mensagem = "Condomínio removido com sucesso!";
                response.Status = true;
            }
            catch (Exception ex)
            {
                response.Mensagem = ex.Message;
                response.Status = false;
            }

            return response;
        }
    }
}
