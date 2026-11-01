using ApiEcoBin.Data;
using ApiEcoBin.Dto.ExpoTokens;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text;
using System.Text.Json;

namespace ApiEcoBin.Services.ExpoTokens
{
    public class ExpoTokensService : IExpoTokensInterface
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ExpoTokensService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _oneSignalAppId;
        private readonly string _oneSignalApiKey;

        public ExpoTokensService(AppDbContext context, ILogger<ExpoTokensService> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _oneSignalAppId = _configuration["OneSignal:AppId"] ?? throw new InvalidOperationException("OneSignal AppId não configurado");
            _oneSignalApiKey = _configuration["OneSignal:ApiKey"] ?? throw new InvalidOperationException("OneSignal ApiKey não configurada");
        }

        public async Task<ResponseModel<ExpoTokensModel>> SalvarTokenAsync(ExpoTokenCreateDTO dto)
        {
            var response = new ResponseModel<ExpoTokensModel>();

            try
            {
                // O Player ID identifica o aparelho: procura primeiro por ele, depois pelo aparelho do usuário
                var tokenExistente = await _context.ExpoTokens
                    .Where(t => t.UsuarioId == dto.UsuarioId && t.Ativo
                             && (t.Token == dto.Token || t.Dispositivo == dto.Dispositivo))
                    .OrderByDescending(t => t.Token == dto.Token)
                    .FirstOrDefaultAsync();

                if (tokenExistente != null)
                {
                    tokenExistente.Token = dto.Token;
                    tokenExistente.Dispositivo = dto.Dispositivo;
                    tokenExistente.Plataforma = dto.Plataforma;
                    tokenExistente.UltimaAtualizacao = DateTime.UtcNow;
                    response.Mensagem = "Token atualizado com sucesso!";
                }
                else
                {
                    tokenExistente = new ExpoTokensModel
                    {
                        UsuarioId = dto.UsuarioId,
                        Token = dto.Token,
                        Dispositivo = dto.Dispositivo,
                        Plataforma = dto.Plataforma,
                        DataCriacao = DateTime.UtcNow,
                        Ativo = true
                    };
                    await _context.ExpoTokens.AddAsync(tokenExistente);
                    response.Mensagem = "Token salvo com sucesso!";
                }

                // Um aparelho pertence só à última conta que entrou nele; desativa cópias e registros de outras contas
                var duplicados = await _context.ExpoTokens
                    .Where(t => t.Ativo && t.Id != tokenExistente.Id
                             && (t.Token == dto.Token || (t.UsuarioId == dto.UsuarioId && t.Dispositivo == dto.Dispositivo)))
                    .ToListAsync();
                foreach (var duplicado in duplicados)
                {
                    duplicado.Ativo = false;
                    duplicado.UltimaAtualizacao = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                response.Dados = tokenExistente;

                response.Status = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao salvar token");
                response.Status = false;
                response.Mensagem = $"Erro ao salvar token: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<List<ExpoTokensModel>>> ListarTokensPorUsuarioAsync(int usuarioId)
        {
            var response = new ResponseModel<List<ExpoTokensModel>>();

            try
            {
                var tokens = await _context.ExpoTokens
                    .Where(t => t.UsuarioId == usuarioId && t.Ativo)
                    .OrderByDescending(t => t.UltimaAtualizacao ?? t.DataCriacao)
                    .ToListAsync();

                response.Dados = tokens;
                response.Status = true;
                response.Mensagem = $"{tokens.Count} token(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar tokens");
                response.Status = false;
                response.Mensagem = $"Erro ao listar tokens: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<ExpoTokensModel>> DesativarTokenAsync(int tokenId)
        {
            var response = new ResponseModel<ExpoTokensModel>();

            try
            {
                var token = await _context.ExpoTokens.FindAsync(tokenId);

                if (token == null)
                {
                    response.Status = false;
                    response.Mensagem = "Token não encontrado.";
                    return response;
                }

                token.Ativo = false;
                token.UltimaAtualizacao = DateTime.UtcNow;

                _context.ExpoTokens.Update(token);
                await _context.SaveChangesAsync();

                response.Dados = token;
                response.Status = true;
                response.Mensagem = "Token desativado com sucesso!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao desativar token");
                response.Status = false;
                response.Mensagem = $"Erro ao desativar token: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<int>> LimparNotificacoesUsuarioAsync(int usuarioId)
        {
            var response = new ResponseModel<int>();

            try
            {
                int removidas = await _context.Notificacoes
                    .Where(n => n.UsuarioId == usuarioId)
                    .ExecuteDeleteAsync();

                response.Dados = removidas;
                response.Status = true;
                response.Mensagem = $"{removidas} notificação(ões) removida(s).";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao limpar notificações do usuário");
                response.Status = false;
                response.Mensagem = $"Erro ao limpar notificações: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<int>> DesativarTokenPorPlayerIdAsync(string playerId)
        {
            var response = new ResponseModel<int>();

            try
            {
                var tokens = await _context.ExpoTokens
                    .Where(t => t.Token == playerId && t.Ativo)
                    .ToListAsync();

                foreach (var token in tokens)
                {
                    token.Ativo = false;
                    token.UltimaAtualizacao = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                response.Dados = tokens.Count;
                response.Status = true;
                response.Mensagem = $"{tokens.Count} token(s) desativado(s).";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao desativar token por Player ID");
                response.Status = false;
                response.Mensagem = $"Erro ao desativar token: {ex.Message}";
            }

            return response;
        }

        // Grava uma notificação por usuário (não por aparelho) e manda cada Player ID uma única vez ao OneSignal
        private async Task<List<NotificacoesModel>> RegistrarEEnviarAsync(
            List<ExpoTokensModel> tokens, string titulo, string mensagem, string? dadosRegistro, string? dadosPush)
        {
            var notificacoes = tokens
                .GroupBy(t => t.UsuarioId)
                .Select(g => new NotificacoesModel
                {
                    ExpoTokenId = g.OrderByDescending(t => t.UltimaAtualizacao ?? t.DataCriacao).First().Id,
                    UsuarioId = g.Key,
                    Titulo = titulo,
                    Mensagem = mensagem,
                    Dados = dadosRegistro,
                    DataEnvio = DateTime.UtcNow
                })
                .ToList();

            await _context.Notificacoes.AddRangeAsync(notificacoes);
            await _context.SaveChangesAsync();

            var playerIds = tokens
                .Select(t => t.Token)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct()
                .ToList();
            var sucesso = await EnviarNotificacaoOneSignalAsync(playerIds!, titulo, mensagem, dadosPush);

            notificacoes.ForEach(n =>
            {
                n.Enviada = sucesso;
                if (!sucesso)
                    n.Erro = "Erro ao enviar via OneSignal";
            });
            await _context.SaveChangesAsync();

            return notificacoes;
        }

        public async Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaTodosAsync(NotificacaoCreateDTO dto)
        {
            var response = new ResponseModel<List<NotificacoesModel>>();

            try
            {
                var tokens = await _context.ExpoTokens
                    .Where(t => t.Ativo)
                    .Include(t => t.Usuario)
                    .ToListAsync();

                if (!tokens.Any())
                {
                    response.Status = false;
                    response.Mensagem = "Nenhum token ativo encontrado.";
                    return response;
                }

                var notificacoes = await RegistrarEEnviarAsync(tokens, dto.Titulo!, dto.Mensagem!, dto.Dados, dto.Dados);

                response.Dados = notificacoes;
                response.Status = true;
                response.Mensagem = $"{notificacoes.Count} notificação(ões) processada(s)!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar notificações para todos");
                response.Status = false;
                response.Mensagem = $"Erro ao enviar notificações: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaUsuariosAsync(NotificacaoEnviarDTO dto)
        {
            var response = new ResponseModel<List<NotificacoesModel>>();

            try
            {
                if (dto.UsuarioIds == null || !dto.UsuarioIds.Any())
                {
                    return await EnviarNotificacaoParaTodosAsync(new NotificacaoCreateDTO
                    {
                        Titulo = dto.Titulo,
                        Mensagem = dto.Mensagem,
                        Dados = dto.Dados
                    });
                }

                var tokens = await _context.ExpoTokens
                    .Where(t => t.Ativo && dto.UsuarioIds.Contains(t.UsuarioId))
                    .Include(t => t.Usuario)
                    .ToListAsync();

                if (!tokens.Any())
                {
                    response.Status = false;
                    response.Mensagem = "Nenhum token ativo encontrado para os usuários especificados.";
                    return response;
                }

                var notificacoes = await RegistrarEEnviarAsync(tokens, dto.Titulo!, dto.Mensagem!, dto.Dados, dto.Dados);

                response.Dados = notificacoes;
                response.Status = true;
                response.Mensagem = $"{notificacoes.Count} notificação(ões) processada(s)!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar notificações para usuários específicos");
                response.Status = false;
                response.Mensagem = $"Erro ao enviar notificações: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<NotificacoesModel>> EnviarNotificacaoParaUsuarioAsync(int usuarioId, NotificacaoCreateDTO dto)
        {
            var response = new ResponseModel<NotificacoesModel>();

            try
            {
                var tokens = await _context.ExpoTokens
                    .Where(t => t.UsuarioId == usuarioId && t.Ativo)
                    .ToListAsync();

                if (!tokens.Any())
                {
                    response.Status = false;
                    response.Mensagem = "Nenhum token ativo encontrado para este usuário.";
                    return response;
                }

                // Envia para todos os aparelhos ativos do usuário (antes ia só para o primeiro da lista)
                var notificacao = (await RegistrarEEnviarAsync(tokens, dto.Titulo!, dto.Mensagem!, dto.Dados, dto.Dados)).Single();

                response.Dados = notificacao;
                response.Status = true;
                response.Mensagem = notificacao.Enviada ? "Notificação enviada com sucesso!" : "Notificação salva, mas houve erro no envio.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar notificação para usuário");
                response.Status = false;
                response.Mensagem = $"Erro ao enviar notificação: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaCondominioAsync(int condominioId, NotificacaoCreateDTO dto)
        {
            var response = new ResponseModel<List<NotificacoesModel>>();

            try
            {
                var usuariosCondominio = await _context.Usuarios
                    .Where(u => u.CondominioId == condominioId)
                    .Select(u => u.Id)
                    .ToListAsync();

                if (!usuariosCondominio.Any())
                {
                    response.Status = false;
                    response.Mensagem = "Nenhum usuário encontrado neste condomínio.";
                    return response;
                }

                var tokens = await _context.ExpoTokens
                    .Where(t => t.Ativo && usuariosCondominio.Contains(t.UsuarioId))
                    .Include(t => t.Usuario)
                    .ToListAsync();

                if (tokens.Count == 0)
                {
                    response.Status = false;
                    response.Mensagem = "Nenhum token ativo encontrado para os usuários deste condomínio.";
                    return response;
                }

                var dadosJson = JsonSerializer.Serialize(new
                {
                    tipo = "condominio",
                    condominioId
                });

                var notificacoes = await RegistrarEEnviarAsync(tokens, dto.Titulo!, dto.Mensagem!, dto.Dados, dadosJson);

                response.Dados = notificacoes;
                response.Status = true;
                response.Mensagem = $"{notificacoes.Count} notificação(ões) enviada(s) para o condomínio!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar notificações para condomínio");
                response.Status = false;
                response.Mensagem = $"Erro ao enviar notificações: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<List<NotificacoesModel>>> EnviarNotificacaoParaCondominioTipoAsync(NotificacaoCondominioTipoDTO dto)
        {
            var response = new ResponseModel<List<NotificacoesModel>>();

            try
            {
                var usuariosCondominio = await _context.Usuarios
                    .Where(u => u.CondominioId == dto.CondominioId && u.Tipo == dto.TipoUsuario)
                    .Select(u => u.Id)
                    .ToListAsync();

                if (usuariosCondominio.Count == 0)
                {
                    response.Status = false;
                    response.Mensagem = $"Nenhum usuário do tipo '{dto.TipoUsuario}' encontrado neste condomínio.";
                    return response;
                }

                var tokens = await _context.ExpoTokens
                    .Where(t => t.Ativo && usuariosCondominio.Contains(t.UsuarioId))
                    .Include(t => t.Usuario)
                    .ToListAsync();

                if (!tokens.Any())
                {
                    response.Status = false;
                    response.Mensagem = $"Nenhum token ativo encontrado para os usuários do tipo '{dto.TipoUsuario}' neste condomínio.";
                    return response;
                }

                var dadosJson = JsonSerializer.Serialize(new
                {
                    tipo = "condominio_tipo",
                    condominioId = dto.CondominioId,
                    tipoUsuario = dto.TipoUsuario.ToString(),
                    tipoUsuarioId = (int)dto.TipoUsuario
                });

                var notificacoes = await RegistrarEEnviarAsync(tokens, dto.Titulo!, dto.Mensagem!, dto.Dados, dadosJson);

                response.Dados = notificacoes;
                response.Status = true;
                response.Mensagem = $"{notificacoes.Count} notificação(ões) enviada(s) para usuários do tipo '{dto.TipoUsuario}' do condomínio!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar notificações para condomínio por tipo de usuário");
                response.Status = false;
                response.Mensagem = $"Erro ao enviar notificações: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<List<NotificacoesModel>>> ListarNotificacoesPorUsuarioAsync(int usuarioId)
        {
            var response = new ResponseModel<List<NotificacoesModel>>();

            try
            {
                var notificacoes = await _context.Notificacoes
                    .Where(n => n.UsuarioId == usuarioId)
                    .OrderByDescending(n => n.DataEnvio)
                    .ToListAsync();

                response.Dados = notificacoes;
                response.Status = true;
                response.Mensagem = $"{notificacoes.Count} notificação(ões) encontrada(s).";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar notificações");
                response.Status = false;
                response.Mensagem = $"Erro ao listar notificações: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<List<NotificacoesModel>>> ListarNotificacoesNaoLidasAsync(int usuarioId)
        {
            var response = new ResponseModel<List<NotificacoesModel>>();

            try
            {
                var notificacoes = await _context.Notificacoes.Where(n => n.UsuarioId == usuarioId && !n.Lida).OrderByDescending(n => n.DataEnvio)
                    .ToListAsync();

                response.Dados = notificacoes;
                response.Status = true;
                response.Mensagem = (notificacoes.Count == 1 ? $"{notificacoes.Count} notificação não lida!" : $"{notificacoes.Count} notificações não lidas!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar notificações não lidas");
                response.Status = false;
                response.Mensagem = $"Erro ao listar notificações: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<NotificacoesModel>> MarcarComoLidaAsync(int notificacaoId)
        {
            var response = new ResponseModel<NotificacoesModel>();

            try
            {
                var notificacao = await _context.Notificacoes.FindAsync(notificacaoId);

                if (notificacao == null)
                {
                    response.Status = false;
                    response.Mensagem = "Notificação não encontrada.";
                    return response;
                }

                notificacao.Lida = true;
                notificacao.DataLeitura = DateTime.UtcNow;

                _context.Notificacoes.Update(notificacao);
                await _context.SaveChangesAsync();

                response.Dados = notificacao;
                response.Status = true;
                response.Mensagem = "Notificação marcada como lida!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar notificação como lida");
                response.Status = false;
                response.Mensagem = $"Erro ao marcar como lida: {ex.Message}";
            }

            return response;
        }

        public async Task<ResponseModel<bool>> MarcarTodasComoLidasAsync(int usuarioId)
        {
            var response = new ResponseModel<bool>();

            try
            {
                var notificacoes = await _context.Notificacoes
                    .Where(n => n.UsuarioId == usuarioId && !n.Lida)
                    .ToListAsync();

                if (!notificacoes.Any())
                {
                    response.Dados = true;
                    response.Status = true;
                    response.Mensagem = "Não há notificações não lidas.";
                    return response;
                }

                foreach (var notificacao in notificacoes)
                {
                    notificacao.Lida = true;
                    notificacao.DataLeitura = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                response.Dados = true;
                response.Status = true;
                response.Mensagem = $"{notificacoes.Count} notificação(ões) marcada(s) como lida(s)!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar todas como lidas");
                response.Status = false;
                response.Mensagem = $"Erro ao marcar como lidas: {ex.Message}";
            }

            return response;
        }

        private async Task<bool> EnviarNotificacaoOneSignalAsync(List<string> playerIds, string titulo, string corpo, string? dadosExtras = null)
        {
            try
            {
                object? dadosExtrasParsed = null;
                if (!string.IsNullOrEmpty(dadosExtras))
                {
                    try
                    {
                        dadosExtrasParsed = JsonSerializer.Deserialize<object>(dadosExtras);
                    }
                    catch
                    {
                        dadosExtrasParsed = new { dados = dadosExtras };
                    }
                }

                var payload = new
                {
                    app_id = _oneSignalAppId,
                    include_player_ids = playerIds,
                    headings = new { en = titulo },
                    contents = new { en = corpo },
                    data = dadosExtrasParsed ?? new { }
                };

                string json = JsonSerializer.Serialize(payload);

                using var httpClient = new HttpClient();
                using var request = new HttpRequestMessage(HttpMethod.Post, "https://onesignal.com/api/v1/notifications");
                request.Headers.Add("Authorization", $"Basic {_oneSignalApiKey}");
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                using var response = await httpClient.SendAsync(request);
                _logger.LogInformation($"OneSignal Status Code: {response.StatusCode}");

                string result = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Resposta OneSignal: {result}");

                if (response.StatusCode != HttpStatusCode.OK)
                    return false;

                // O OneSignal responde 200 mesmo quando alguns Player IDs não existem mais (app desinstalado)
                using var doc = JsonDocument.Parse(result);
                if (doc.RootElement.TryGetProperty("errors", out var errors)
                    && errors.ValueKind == JsonValueKind.Object
                    && errors.TryGetProperty("invalid_player_ids", out var invalidos))
                {
                    var ids = invalidos.EnumerateArray().Select(i => i.GetString()).Where(i => i != null).ToList();
                    var tokensInvalidos = await _context.ExpoTokens.Where(t => t.Ativo && ids.Contains(t.Token)).ToListAsync();
                    foreach (var token in tokensInvalidos)
                    {
                        token.Ativo = false;
                        token.UltimaAtualizacao = DateTime.UtcNow;
                    }
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"{tokensInvalidos.Count} token(s) inválido(s) desativado(s) após envio.");
                }

                // "id" vazio significa que nenhum aparelho recebeu
                return doc.RootElement.TryGetProperty("id", out var id) && !string.IsNullOrEmpty(id.GetString());
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HttpRequestException ao enviar notificação OneSignal");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar notificação OneSignal");
                return false;
            }
        }

        public async Task<ResponseModel<int>> DeletarNotificacoesAntigasAsync(DateTime dataLimite)
        {
            var response = new ResponseModel<int>();

            try
            {
                var notificacoesAntigas = await _context.Notificacoes
                    .Where(t => t.DataEnvio < dataLimite)
                    .ToListAsync();

                var count = notificacoesAntigas.Count;

                _context.Notificacoes.RemoveRange(notificacoesAntigas);
                await _context.SaveChangesAsync();

                response.Status = true;
                response.Dados = count;
                response.Mensagem = $"{count} notificações antigas removidas.";

                _logger.LogInformation($"Limpeza: {count} notificações anteriores a {dataLimite:yyyy-MM-dd} removidas.");
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Mensagem = ex.Message;
                _logger.LogError(ex, "Erro ao deletar notificações antigas");
            }

            return response;
        }
    }
}