using ApiEcoBin.Model;
using ApiEcoBin.Model.Enums;
using ApiEcoBin.ViewModel;
using Microsoft.AspNetCore.Mvc;

namespace ApiEcoBin.Controllers
{
    [ApiController]
    [Route("api/v1/EcoBin")]
    public class EcoBin(IEcoBin<Usuarios> ecoBinUsuarios,
             IEcoBin<Condominios> ecoBinCondominios,
             IEcoBin<Sensores> ecoBinSensores,
             IEcoBin<Provisionamentos> ecoBinProvisionamentos,
             IEcoBin<Telemetrias> ecoBinTelemetrias) : Controller
    {
        private readonly IEcoBin<Usuarios> _ecoBinUsuarios = ecoBinUsuarios; 
        private readonly IEcoBin<Condominios> _ecoBinCondominios = ecoBinCondominios;
        private readonly IEcoBin<Sensores> _ecoBinSensores = ecoBinSensores;
        private readonly IEcoBin<Provisionamentos> _ecoBinProvisionamentos = ecoBinProvisionamentos;
        private readonly IEcoBin<Telemetrias> _ecoBinTelemetrias = ecoBinTelemetrias;

        [HttpPost("users")]
        public async Task<IActionResult> AddUser(UsuariosVM usuariosView)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var usuario = new Usuarios(usuariosView.Nome, usuariosView.Email, usuariosView.SenhaHash, usuariosView.Tipo);
                var resultado = await _ecoBinUsuarios.AddAsync(usuario);
                return Ok(new { message = "Usuário criado com sucesso ", resultado.id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }
    }
}
