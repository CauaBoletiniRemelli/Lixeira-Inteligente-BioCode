using ApiEcoBin.Data;
using ApiEcoBin.Dto.Devices;
using ApiEcoBin.Dto.Provisionamentos;
using ApiEcoBin.Enums;
using ApiEcoBin.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QRCoder;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ApiEcoBin.Services.Provisionamentos
{
    public class ProvisionamentosService(AppDbContext appDbContext, IConfiguration configuration) : IProvisionamentosInteraface
    {
        private readonly AppDbContext _context = appDbContext;
        private readonly IConfiguration _configuration = configuration;

        public async Task<ResponseModel<ProvisionamentosModel>> CreateProvisionamentoAsync(ProvisionCreateRequestDTO dto)
        {
            var response = new ResponseModel<ProvisionamentosModel>();
            try
            {
                var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == dto.SensorId);
                if (sensor == null)
                    return new ResponseModel<ProvisionamentosModel> { Status = false, Mensagem = "Sensor não encontrado." };

                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.UsuarioId);
                if (usuario == null)
                    return new ResponseModel<ProvisionamentosModel> { Status = false, Mensagem = "Usuário não encontrado." };

                var provision = new ProvisionamentosModel
                {
                    SensorId = dto.SensorId,
                    UsuarioId = dto.UsuarioId,
                    Expiracao = DateTime.UtcNow.AddDays(dto.ExpiracaoDias),
                    Usado = false,
                    CriadoEm = DateTime.UtcNow,
                    Sensor = sensor,
                    Usuario = usuario
                };

                _context.Provisionamentos.Add(provision);
                await _context.SaveChangesAsync();

                response.Status = true;
                response.Mensagem = "Provisionamento criado com sucesso.";
                response.Dados = provision;
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseModel<ProvisionamentosModel> { Status = false, Mensagem = ex.Message + ex.StackTrace };
            }
        }

        public async Task<ResponseModel<ProvisionamentosModel>> CreateProvisionamentoComSensorAsync(ProvisionCreateWithSensorDTO dto)
        {
            var response = new ResponseModel<ProvisionamentosModel>();
            
            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var sensor = new SensoresModel
                {
                    DeviceId = Guid.NewGuid().ToString("N"), // DeviceId temporário
                    DeviceKey = Guid.NewGuid().ToString("N"),
                    Nome = dto.NomeSensor,
                    CondominioId = dto.CondominioId,
                    Status = 0, 
                    CriadoEm = DateTime.UtcNow
                };

                _context.Sensores.Add(sensor);
                await _context.SaveChangesAsync();

                var provision = new ProvisionamentosModel
                {
                    SensorId = sensor.Id,
                    UsuarioId = dto.UsuarioId,
                    Expiracao = DateTime.UtcNow.AddDays(dto.ExpiracaoDias),
                    Usado = false,
                    CriadoEm = DateTime.UtcNow
                };

                _context.Provisionamentos.Add(provision);
                await _context.SaveChangesAsync();

                await tx.CommitAsync();

                response.Status = true;
                response.Mensagem = "Sensor placeholder e provisionamento criados com sucesso.";
                response.Dados = provision;
                return response;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return new ResponseModel<ProvisionamentosModel> { Status = false, Mensagem = ex.Message };
            }
        }

        public async Task<ResponseModel<List<ProvisionamentosModel>>> GetProvisionamentosAsync()
        {
            var response = new ResponseModel<List<ProvisionamentosModel>>();
            try
            {
                var provisionamentos = await _context.Provisionamentos
                    .OrderByDescending(p => p.CriadoEm)
                    .ToListAsync();

                response.Status = true;
                response.Dados = provisionamentos;
                response.Mensagem = "Lista de provisionamentos retornada.";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseModel<List<ProvisionamentosModel>> { Status = false, Mensagem = ex.Message };
            }
        }

        public async Task<ResponseModel<ProvisionamentosModel>> GetProvisionamentoByIdAsync(int id)
        {
            var response = new ResponseModel<ProvisionamentosModel>();
            try
            {
                var prov = await _context.Provisionamentos.FirstOrDefaultAsync(p => p.Id == id);
                
                if (prov == null)
                    return new ResponseModel<ProvisionamentosModel> { Status = false, Mensagem = "Provisionamento não encontrado." };

                response.Status = true;
                response.Dados = prov;
                response.Mensagem = "Provisionamento encontrado.";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseModel<ProvisionamentosModel> { Status = false, Mensagem = ex.Message };
            }
        }

        private string GerarTokenDeProvisionamento(ProvisionamentosModel provision)
        {
            var sensor = _context.Sensores.FirstOrDefault(s => s.Id == provision.SensorId);
            string deviceId = sensor?.DeviceId ?? provision.SensorId.ToString();

            var keyBytes = Convert.FromBase64String(_configuration["JwtSettings:SecretKey"]!);
            var signingKey = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("provId", provision.Id.ToString()),
                new Claim("deviceId", deviceId)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        private ClaimsPrincipal ValidateProvisionJwt(string jwt)
        {
            var keyBytes = Convert.FromBase64String(_configuration["JwtSettings:SecretKey"]!);
            var signingKey = new SymmetricSecurityKey(keyBytes);

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _configuration["JwtSettings:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["JwtSettings:Audience"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30)
            };

            return tokenHandler.ValidateToken(jwt, validationParameters, out var validatedToken);
        }

        public async Task<ResponseModel<ProvisionQrResponseDTO>> CreateQrCodeProvisionamentoAsync(int provisionId)
        {
            var response = new ResponseModel<ProvisionQrResponseDTO>();
            try
            {
                var prov = await _context.Provisionamentos.FirstOrDefaultAsync(p => p.Id == provisionId);
                if (prov == null) return new ResponseModel<ProvisionQrResponseDTO> { Status = false, Mensagem = "Provisionamento não encontrado." };

                var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == prov.SensorId);
                string deviceId = sensor?.DeviceId ?? prov.SensorId.ToString();

                string jwt = GerarTokenDeProvisionamento(prov);

                string qrPayload = $"{prov.Id}|{deviceId}|{jwt}";

                QRCodeGenerator qrGenerator = new();
                var qrData = qrGenerator.CreateQrCode(qrPayload, QRCodeGenerator.ECCLevel.Q);
                var png = new PngByteQRCode(qrData);
                byte[] bytes = png.GetGraphic(20);

                response.Status = true;
                response.Dados = new ProvisionQrResponseDTO { QrBytes = bytes };
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseModel<ProvisionQrResponseDTO> { Status = false, Mensagem = ex.Message };
            }
        }


        public async Task<ResponseModel<ProvisionActivateResponseDTO>> ActivateProvisionAsync(ProvisionActivateRequestDTO dto, int? userIdFromClaim = null)
        {
            var response = new ResponseModel<ProvisionActivateResponseDTO>();

            ClaimsPrincipal principal;
            try { principal = ValidateProvisionJwt(dto.Token); }
            catch (SecurityTokenExpiredException) { return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = "Token expirado." }; }
            catch { return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = "Token inválido." }; }

            var provIdFromToken = principal.FindFirst("provId")?.Value;
            var deviceIdFromToken = principal.FindFirst("deviceId")?.Value;
            if (provIdFromToken == null || deviceIdFromToken == null) return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = "Claims faltando." };

            if (provIdFromToken != dto.ProvisionId || deviceIdFromToken != dto.DeviceId)
                return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = "Token não corresponde ao QR." };

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var prov = await _context.Provisionamentos.FirstOrDefaultAsync(p => p.Id.ToString() == dto.ProvisionId);
                if (prov == null) return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = "Provisionamento não encontrado." };

                if (prov.Usado) return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = "Provisionamento já usado." };
                if (prov.Expiracao < DateTime.UtcNow) return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = "Provisionamento expirado." };

                // Buscar sensor pelo ID do provisionamento (pode ser placeholder)
                var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == prov.SensorId);
                
                if (sensor == null)
                {
                    // Criar novo sensor se não existir
                    sensor = new SensoresModel
                    {
                        DeviceId = dto.DeviceId,
                        DeviceKey = Guid.NewGuid().ToString("N"),
                        Nome = dto.NomeSensor,
                        CondominioId = dto.CondominioId,
                        Latitude = dto.Latitude,
                        Longitude = dto.Longitude,
                        Tipo = dto.TipoLixeira ?? TipoLixeira.NaoDefinido,
                        CapacidadeLitros = dto.CapacidadeLitros,
                        Status = 0,
                        CriadoEm = DateTime.UtcNow
                    };
                    _context.Sensores.Add(sensor);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Atualizar sensor placeholder com DeviceId real e outros dados
                    sensor.DeviceId = dto.DeviceId; // IMPORTANTE: Atualiza o DeviceId temporário com o real
                    sensor.Nome = dto.NomeSensor ?? sensor.Nome;
                    sensor.CondominioId = dto.CondominioId;
                    sensor.Latitude = dto.Latitude ?? sensor.Latitude;
                    sensor.Longitude = dto.Longitude ?? sensor.Longitude;
                    sensor.Tipo = dto.TipoLixeira ?? sensor.Tipo;
                    sensor.CapacidadeLitros = dto.CapacidadeLitros ?? sensor.CapacidadeLitros;
                    _context.Sensores.Update(sensor);
                    await _context.SaveChangesAsync();
                }

                byte[] tokenBytes = new byte[24];
                RandomNumberGenerator.Fill(tokenBytes);
                string sessionToken = Convert.ToBase64String(tokenBytes);
                prov.SessionToken = sessionToken;
                prov.SessionExpires = DateTime.UtcNow.AddMinutes(10);

                if (userIdFromClaim.HasValue) prov.UsuarioId = userIdFromClaim.Value;

                prov.SsidCriptografado = CriptografarDado(dto.WifiSSID);
                prov.SenhaWifiCriptografada = CriptografarDado(dto.WifiPassword);
                prov.NomeSensor = dto.NomeSensor;

                _context.Provisionamentos.Update(prov);
                await _context.SaveChangesAsync();

                await tx.CommitAsync();

                response.Status = true;
                response.Dados = new ProvisionActivateResponseDTO
                {
                    Success = true,
                    DeviceId = dto.DeviceId,
                    SensorId = sensor.Id,
                    SessionToken = sessionToken,
                    SessionExpires = prov.SessionExpires ?? DateTime.UtcNow.AddMinutes(10),
                    Message = "Provisionamento criado. Use sessionToken para configurar o sensor via AP."
                };

                return response;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return new ResponseModel<ProvisionActivateResponseDTO> { Status = false, Mensagem = ex.Message };
            }
        }

        private string CriptografarDado(string dado)
        {
            var keyBytes = Convert.FromBase64String(_configuration["JwtSettings:SecretKey"]!);
            using var aes = Aes.Create();
            // garante chave com 32 bytes (AES-256)
            aes.Key = keyBytes.Take(32).ToArray();
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            var plainBytes = Encoding.UTF8.GetBytes(dado);
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            var result = new byte[aes.IV.Length + cipherBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);

            return Convert.ToBase64String(result);
        }

        private string DescriptografarDado(string dadoCriptografado)
        {
            var keyBytes = Convert.FromBase64String(_configuration["JwtSettings:SecretKey"]!);
            var fullCipher = Convert.FromBase64String(dadoCriptografado);

            using var aes = Aes.Create();
            aes.Key = keyBytes.Take(32).ToArray();

            var ivLength = aes.BlockSize / 8;
            var iv = new byte[ivLength];
            var cipher = new byte[fullCipher.Length - ivLength];

            Buffer.BlockCopy(fullCipher, 0, iv, 0, ivLength);
            Buffer.BlockCopy(fullCipher, ivLength, cipher, 0, cipher.Length);

            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);

            return Encoding.UTF8.GetString(plainBytes);
        }

        public async Task<ResponseModel<WifiCredentialsResponseDTO>> GetWifiCredentialsAsync(string deviceId, string sessionToken)
        {
            var response = new ResponseModel<WifiCredentialsResponseDTO>();
            try
            {
                var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.DeviceId == deviceId);
                if (sensor == null)
                    return new ResponseModel<WifiCredentialsResponseDTO> { Status = false, Mensagem = "Sensor não encontrado." };

                var prov = await _context.Provisionamentos
                    .FirstOrDefaultAsync(p => p.SensorId == sensor.Id && p.SessionToken == sessionToken);

                if (prov == null)
                    return new ResponseModel<WifiCredentialsResponseDTO> { Status = false, Mensagem = "Session token inválido." };

                if (prov.SessionExpires == null || prov.SessionExpires < DateTime.UtcNow)
                    return new ResponseModel<WifiCredentialsResponseDTO> { Status = false, Mensagem = "Session expirado." };

                if (string.IsNullOrEmpty(prov.SsidCriptografado) || string.IsNullOrEmpty(prov.SenhaWifiCriptografada))
                    return new ResponseModel<WifiCredentialsResponseDTO> { Status = false, Mensagem = "Credenciais Wi-Fi não configuradas." };

                string ssid = DescriptografarDado(prov.SsidCriptografado);
                string password = DescriptografarDado(prov.SenhaWifiCriptografada);

                response.Status = true;
                response.Dados = new WifiCredentialsResponseDTO
                {
                    SSID = ssid,
                    Password = password,
                    SessionExpires = prov.SessionExpires.Value,
                    DeviceId = deviceId
                };
                response.Mensagem = "Credenciais Wi-Fi recuperadas com sucesso.";

                return response;
            }
            catch (Exception ex)
            {
                return new ResponseModel<WifiCredentialsResponseDTO> { Status = false, Mensagem = ex.Message };
            }
        }

        public async Task<ResponseModel<bool>> ConfirmDeviceConfigAsync(string deviceId, Dto.Devices.ConfirmConfigDTO dto)
        {
            var response = new ResponseModel<bool>();
            try
            {
                var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.DeviceId == deviceId);
                if (sensor == null) 
                    return new ResponseModel<bool> { Status = false, Mensagem = "Sensor não encontrado." };

                var prov = await _context.Provisionamentos
                    .FirstOrDefaultAsync(p => p.SensorId == sensor.Id && p.SessionToken == dto.SessionToken);

                if (prov == null) 
                    return new ResponseModel<bool> { Status = false, Mensagem = "Session token inválido para este sensor." };

                if (prov.SessionExpires == null || prov.SessionExpires < DateTime.UtcNow)
                    return new ResponseModel<bool> { Status = false, Mensagem = "Session expirado." };

                if (!dto.WifiConnected)
                {
                    return new ResponseModel<bool> 
                    { 
                        Status = false, 
                        Mensagem = $"Dispositivo não conseguiu conectar ao Wi-Fi. {dto.Message}" 
                    };
                }

                using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    prov.Usado = true;
                    prov.SessionToken = null;
                    prov.SessionExpires = null;
                    _context.Provisionamentos.Update(prov);

                    sensor.Status = 1;
                    sensor.UltimaConexao = DateTime.UtcNow;
                    _context.Sensores.Update(sensor);

                    await _context.SaveChangesAsync();
                    await tx.CommitAsync();

                    return new ResponseModel<bool> 
                    { 
                        Status = true, 
                        Mensagem = "Sensor confirmado e ativado com sucesso.", 
                        Dados = true 
                    };
                }
                catch (Exception ex)
                {
                    await tx.RollbackAsync();
                    return new ResponseModel<bool> { Status = false, Mensagem = ex.Message };
                }
            }
            catch (Exception ex)
            {
                return new ResponseModel<bool> { Status = false, Mensagem = ex.Message };
            }
        }

        public async Task<ResponseModel<object>> AssignWifiToSessionAsync(string sessionToken, AssignWifiRequestDTO dto)
        {
            var response = new ResponseModel<object>();
            try
            {
                if (string.IsNullOrWhiteSpace(sessionToken))
                    return new ResponseModel<object> { Status = false, Mensagem = "sessionToken obrigatório." };

                var prov = await _context.Provisionamentos
                    .FirstOrDefaultAsync(p => p.SessionToken == sessionToken);

                if (prov == null)
                    return new ResponseModel<object> { Status = false, Mensagem = "Session token inválido." };

                if (prov.SessionExpires == null || prov.SessionExpires < DateTime.UtcNow)
                    return new ResponseModel<object> { Status = false, Mensagem = "Session expirado." };

                if (prov.Usado)
                    return new ResponseModel<object> { Status = false, Mensagem = "Provisionamento já utilizado." };

                prov.SsidCriptografado = CriptografarDado(dto.WifiSSID ?? string.Empty);
                prov.SenhaWifiCriptografada = CriptografarDado(dto.WifiPassword ?? string.Empty);

                _context.Provisionamentos.Update(prov);
                await _context.SaveChangesAsync();

                response.Status = true;
                response.Mensagem = "Credenciais Wi-Fi atribuídas à sessão com sucesso.";
                response.Dados = null;
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseModel<object> { Status = false, Mensagem = ex.Message };
            }
        }

    }
}
