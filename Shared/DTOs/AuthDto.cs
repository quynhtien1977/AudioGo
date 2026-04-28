namespace Shared.DTOs
{
    public record LoginRequest(string Identifier, string Password);

    public record LoginResponse(string Token, string Role, string AccountId, string FullName, DateTime ExpiresAt);

    public record RegisterRequest(string Username, string Password, string Role = "Manager");
}
