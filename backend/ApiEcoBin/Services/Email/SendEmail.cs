using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.VisualBasic;
using System.Net;
using System.Net.Mail;
using System.Reflection.Metadata;
using System.Text;

namespace ApiEcoBin.Services.Email
{
    public class SendEmail
    {
        private readonly string Host = "smtp.gmail.com";
        private readonly int Port = 587; 
        private readonly string User = "grupoecobin@gmail.com";
        private readonly string Password = "tbvr zahn qtxv qakp";
        private readonly string FromAddress = "grupoecobin@gmail.com";
        private readonly string FromName = "EcoBin";

        public void Send(string emailTo, string emailSubject, string emailBody)
        {
            try
            {
                using var mail = new MailMessage();
                using var smtp = new SmtpClient();
                mail.From = new MailAddress(FromAddress, FromName);
                mail.To.Add(new MailAddress(emailTo));
                mail.Subject = emailSubject;
                mail.Body = emailBody;
                mail.IsBodyHtml = true;

                smtp.Host = Host;
                smtp.Port = Port;
                smtp.EnableSsl = true;
                smtp.UseDefaultCredentials = false;
                smtp.Credentials = new NetworkCredential(User, Password);
                smtp.Timeout = 20000;
                smtp.DeliveryMethod = SmtpDeliveryMethod.Network;

                smtp.Send(mail);
            }
            catch (Exception ex)
            {
                var details = BuildExceptionDetails(ex);
                File.AppendAllText("smtp_errors.log", $"{DateTime.UtcNow:O} - {details}\n\n");
                throw new Exception("Erro ao enviar email: " + details);
            }
        }

        private string BuildExceptionDetails(Exception ex)
        {
            var sb = new StringBuilder();
            var e = ex;
            int level = 0;
            while (e != null)
            {
                sb.AppendLine($"-- Exception level {level} --");
                sb.AppendLine($"Type: {e.GetType().FullName}");
                sb.AppendLine($"Message: {e.Message}");
                sb.AppendLine($"StackTrace: {e.StackTrace}");
                e = e.InnerException;
                level++;
            }
            return sb.ToString();
        }
    }
}