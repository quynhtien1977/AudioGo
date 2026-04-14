namespace Shared.DTOs
{
    public record LoginRequest(string Username, string Password);

    public record LoginResponse(string Token, string Role, string AccountId, DateTime ExpiresAt);

    public record RegisterRequest(string Username, string Password, string Role = "Manager");
}
