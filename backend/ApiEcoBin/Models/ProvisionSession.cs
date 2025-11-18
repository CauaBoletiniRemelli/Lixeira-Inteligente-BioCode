using System.ComponentModel.DataAnnotations;

namespace ApiEcoBin.Models
{
    public class ProvisionSession
    {
        [Key]
        public int Id { get; set; }

        public string DeviceId { get; set; } = null!;     
        public string SessionToken { get; set; } = null!;  
        public string? AssignedWifiSSID { get; set; }     
        public string? AssignedWifiPassword { get; set; } 
        public string Status { get; set; } = "PENDING";   
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public string? DeviceMac { get; set; }            
        public string? Firmware { get; set; }
    }
}
