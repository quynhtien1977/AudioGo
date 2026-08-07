using Server.Helpers;

namespace Api.Tests.Security;

/// <summary>
/// Tests cho PasswordGenerator — kiểm tra mật khẩu sinh ra đáp ứng yêu cầu bảo mật
/// </summary>
public class PasswordGeneratorTests
{
    [Fact]
    public void Generate_ReturnsPasswordWithCorrectLength()
    {
        var password = PasswordGenerator.Generate();

        Assert.InRange(password.Length, 10, 12);
    }

    [Fact]
    public void Generate_ContainsUppercaseLetter()
    {
        var password = PasswordGenerator.Generate();

        Assert.True(password.Any(char.IsUpper),
            $"Password '{password}' không có chữ hoa");
    }

    [Fact]
    public void Generate_ContainsLowercaseLetter()
    {
        var password = PasswordGenerator.Generate();

        Assert.True(password.Any(char.IsLower),
            $"Password '{password}' không có chữ thường");
    }

    [Fact]
    public void Generate_ContainsDigit()
    {
        var password = PasswordGenerator.Generate();

        Assert.True(password.Any(char.IsDigit),
            $"Password '{password}' không có số");
    }

    [Fact]
    public void Generate_ContainsSpecialCharacter()
    {
        var special = "!@#$%^&*-_=+";
        var password = PasswordGenerator.Generate();

        Assert.True(password.Any(c => special.Contains(c)),
            $"Password '{password}' không có ký tự đặc biệt");
    }

    [Theory]
    [InlineData(100)]
    public void Generate_AlwaysProducesUniquePasswords(int count)
    {
        // Với 100 lần sinh, không được có trùng (crypto-safe RNG)
        var passwords = Enumerable.Range(0, count)
            .Select(_ => PasswordGenerator.Generate())
            .ToList();

        var unique = passwords.Distinct().Count();
        Assert.Equal(count, unique);
    }

    [Theory]
    [InlineData(50)]
    public void Generate_AllPasswords_MeetRequirements(int count)
    {
        // Dùng đúng list ký tụ đặc biệt của PasswordGenerator: "@#$%&*!?"
        const string special = "@#$%&*!?";

        for (int i = 0; i < count; i++)
        {
            var pwd = PasswordGenerator.Generate();
            Assert.InRange(pwd.Length, 10, 12);
            Assert.True(pwd.Any(char.IsUpper),  $"[{i}] '{pwd}' thiếu chữ hoa");
            Assert.True(pwd.Any(char.IsLower),  $"[{i}] '{pwd}' thiếu chữ thường");
            Assert.True(pwd.Any(char.IsDigit),  $"[{i}] '{pwd}' thiếu số");
            Assert.True(pwd.Any(c => special.Contains(c)),
                $"[{i}] '{pwd}' thiếu ký tụ đặc biệt");
        }
    }
}
