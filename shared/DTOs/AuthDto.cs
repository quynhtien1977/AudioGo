namespace Shared.DTOs
{
    public record LoginRequest(string Identifier, string Password);

    public record LoginResponse(
        string Token,
        string Role,
        string AccountId,
        string FullName,
        DateTime ExpiresAt,
        bool MustChangePassword = false);

    public record RegisterRequest(string Username, string Password, string Role = "Manager");

    public record ForgotPasswordRequest(string Email);

    public record ResetPasswordRequest(string Token, string NewPassword);

    public record ChangePasswordRequest(string OldPassword, string NewPassword);
}
