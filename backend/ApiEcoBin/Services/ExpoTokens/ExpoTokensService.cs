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
                var tokenExistente = await _context.ExpoTokens
                    .FirstOrDefaultAsync(t => t.UsuarioId == dto.UsuarioId
                                           && t.Dispositivo == dto.Dispositivo
                                           && t.Ativo);

                if (tokenExistente != null)
                {
                    tokenExistente.Token = dto.Token;
                    tokenExistente.Plataforma = dto.Plataforma;
                    tokenExistente.UltimaAtualizacao = DateTime.UtcNow;

                    _context.ExpoTokens.Update(tokenExistente);
                    await _context.SaveChangesAsync();

                    response.Dados = tokenExistente;
                    response.Mensagem = "Token atualizado com sucesso!";
                }
                else
                {
                    var novoToken = new ExpoTokensModel
                    {
                        UsuarioId = dto.UsuarioId,
                        Token = dto.Token,
                        Dispositivo = dto.Dispositivo,
                        Plataforma = dto.Plataforma,
                        DataCriacao = DateTime.UtcNow,
                        Ativo = true
                    };

                    await _context.ExpoTokens.AddAsync(novoToken);
                    await _context.SaveChangesAsync();

                    response.Dados = novoToken;
                    response.Mensagem = "Token salvo com sucesso!";
                }

                response.Status = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao salvar token");
                response.Status = false;
                response.Mensagem = $"Erro ao salvar token: {ex.Message} + {ex.InnerException}";
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

                var notificacoes = new List<NotificacoesModel>();

                foreach (var token in tokens)
                {
                    var notificacao = new NotificacoesModel
                    {
                        ExpoTokenId = token.Id,
                        UsuarioId = token.UsuarioId,
                        Titulo = dto.Titulo,
                        Mensagem = dto.Mensagem,
                        Dados = dto.Dados,
                        DataEnvio = DateTime.UtcNow
                    };

                    notificacoes.Add(notificacao);
                }

                await _context.Notificacoes.AddRangeAsync(notificacoes);
                await _context.SaveChangesAsync();

                var playerIds = tokens.Select(t => t.Token!).ToList();
                var sucesso = await EnviarNotificacaoOneSignalAsync(playerIds, dto.Titulo!, dto.Mensagem!, dto.Dados);

                notificacoes.ForEach(n =>
                {
                    n.Enviada = sucesso;
                    if (!sucesso)
                        n.Erro = "Erro ao enviar via OneSignal";
                });
                await _context.SaveChangesAsync();

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

                var notificacoes = new List<NotificacoesModel>();

                foreach (var token in tokens)
                {
                    var notificacao = new NotificacoesModel
                    {
                        ExpoTokenId = token.Id,
                        UsuarioId = token.UsuarioId,
                        Titulo = dto.Titulo,
                        Mensagem = dto.Mensagem,
                        Dados = dto.Dados,
                        DataEnvio = DateTime.UtcNow
                    };

                    notificacoes.Add(notificacao);
                }

                await _context.Notificacoes.AddRangeAsync(notificacoes);
                await _context.SaveChangesAsync();

                var playerIds = tokens.Select(t => t.Token!).ToList();
                var sucesso = await EnviarNotificacaoOneSignalAsync(playerIds, dto.Titulo!, dto.Mensagem!, dto.Dados);

                notificacoes.ForEach(n =>
                {
                    n.Enviada = sucesso;
                    if (!sucesso)
                        n.Erro = "Erro ao enviar via OneSignal";
                });
                await _context.SaveChangesAsync();

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

                var token = tokens.First();

                var notificacao = new NotificacoesModel
                {
                    ExpoTokenId = token.Id,
                    UsuarioId = usuarioId,
                    Titulo = dto.Titulo,
                    Mensagem = dto.Mensagem,
                    Dados = dto.Dados,
                    DataEnvio = DateTime.UtcNow
                };

                await _context.Notificacoes.AddAsync(notificacao);
                await _context.SaveChangesAsync();

                var playerIds = new List<string> { token.Token! };
                var sucesso = await EnviarNotificacaoOneSignalAsync(playerIds, dto.Titulo!, dto.Mensagem!, dto.Dados);

                notificacao.Enviada = sucesso;
                if (!sucesso)
                    notificacao.Erro = "Erro ao enviar via OneSignal";

                await _context.SaveChangesAsync();

                response.Dados = notificacao;
                response.Status = true;
                response.Mensagem = sucesso ? "Notificação enviada com sucesso!" : "Notificação salva, mas houve erro no envio.";
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

                var notificacoes = new List<NotificacoesModel>();

                foreach (var token in tokens)
                {
                    var notificacao = new NotificacoesModel
                    {
                        ExpoTokenId = token.Id,
                        UsuarioId = token.UsuarioId,
                        Titulo = dto.Titulo,
                        Mensagem = dto.Mensagem,
                        Dados = dto.Dados,
                        DataEnvio = DateTime.UtcNow
                    };

                    notificacoes.Add(notificacao);
                }

                await _context.Notificacoes.AddRangeAsync(notificacoes);
                await _context.SaveChangesAsync();

                var playerIds = tokens.Select(t => t.Token!).ToList();
                var dadosExtras = new
                {
                    tipo = "condominio",
                    condominioId
                };

                var dadosJson = JsonSerializer.Serialize(dadosExtras);
                var sucesso = await EnviarNotificacaoOneSignalAsync(playerIds, dto.Titulo!, dto.Mensagem!, dadosJson);

                notificacoes.ForEach(n =>
                {
                    n.Enviada = sucesso;
                    if (!sucesso)
                        n.Erro = "Erro ao enviar via OneSignal";
                });
                await _context.SaveChangesAsync();

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

                var notificacoes = new List<NotificacoesModel>();

                foreach (var token in tokens)
                {
                    var notificacao = new NotificacoesModel
                    {
                        ExpoTokenId = token.Id,
                        UsuarioId = token.UsuarioId,
                        Titulo = dto.Titulo,
                        Mensagem = dto.Mensagem,
                        Dados = dto.Dados,
                        DataEnvio = DateTime.UtcNow
                    };

                    notificacoes.Add(notificacao);
                }

                await _context.Notificacoes.AddRangeAsync(notificacoes);
                await _context.SaveChangesAsync();

                var playerIds = tokens.Select(t => t.Token!).ToList();
                var dadosExtras = new
                {
                    tipo = "condominio_tipo",
                    condominioId = dto.CondominioId,
                    tipoUsuario = dto.TipoUsuario.ToString(),
                    tipoUsuarioId = (int)dto.TipoUsuario
                };

                var dadosJson = JsonSerializer.Serialize(dadosExtras);
                var sucesso = await EnviarNotificacaoOneSignalAsync(playerIds, dto.Titulo!, dto.Mensagem!, dadosJson);

                notificacoes.ForEach(n =>
                {
                    n.Enviada = sucesso;
                    if (!sucesso)
                        n.Erro = "Erro ao enviar via OneSignal";
                });
                await _context.SaveChangesAsync();

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
                var notificacoes = await _context.Notificacoes
                    .Where(n => n.UsuarioId == usuarioId && !n.Lida)
                    .OrderByDescending(n => n.DataEnvio)
                    .ToListAsync();

                response.Dados = notificacoes;
                response.Status = true;
                response.Mensagem = $"{notificacoes.Count} notificação(ões) não lida(s).";
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

                return response.StatusCode == HttpStatusCode.OK;
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
    }
}