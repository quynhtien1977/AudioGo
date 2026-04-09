namespace Shared.DTOs
{
    // CREATE
    public class AccountCreateRequest
    {
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Role { get; set; } = "User";

        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }

    // UPDATE
    public class AccountUpdateRequest
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }

        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }

        public bool? IsLocked { get; set; }
    }

    // RESPONSE DTO
    public record AccountDto(
        string AccountId,
        string Username,
        string Role,

        string? FullName,
        string? Email,
        string? PhoneNumber,
        bool IsLocked,

        DateTime CreatedAt,
        DateTime? UpdatedAt
    );
}