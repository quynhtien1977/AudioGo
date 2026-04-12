namespace AudioGo_Mobile;

using AudioGo_Mobile.Views;
using System.Text;
using System.Text.Json;

public partial class App : Application
{
	public App()
	{
		InitializeComponent();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		// KHÔNG gọi async ở đây — sẽ gây deadlock trên Android/iOS.
		// Luôn mở NavigationPage + WelcomePage trước,
		// rồi OnStart sẽ check token và redirect nếu còn hạn.
		return new Window(new NavigationPage(new WelcomePage()));
	}

	protected override async void OnStart()
	{
		base.OnStart();
		await CheckAndRestoreSessionAsync();
	}

	/// <summary>
	/// Nếu GuestToken còn hạn → chuyển thẳng vào AppShell mà không cần quét QR lại.
	/// </summary>
	private static async Task CheckAndRestoreSessionAsync()
	{
		try
		{
			var token = await SecureStorage.GetAsync("GuestToken");
			if (!string.IsNullOrEmpty(token) && IsJwtValid(token))
			{
				// Token hợp lệ → vào thẳng app
				if (Application.Current?.MainPage is NavigationPage)
				{
					Application.Current.MainPage = new AppShell();
					await Shell.Current.GoToAsync("//Home", animate: false);
				}
				return;
			}

			// Token hết hạn → xóa
			if (!string.IsNullOrEmpty(token))
				SecureStorage.Remove("GuestToken");
		}
		catch
		{
			// Lỗi SecureStorage (Android key store issue, ...) → để WelcomePage bình thường
		}
	}

	/// <summary>
	/// Tự parse JWT expiry qua Base64 — không cần NuGet thêm.
	/// </summary>
	private static bool IsJwtValid(string token)
	{
		try
		{
			var parts = token.Split('.');
			if (parts.Length != 3) return false;

			// Base64Url → Base64 chuẩn
			var payload = parts[1]
				.Replace('-', '+')
				.Replace('_', '/');

			switch (payload.Length % 4)
			{
				case 2: payload += "=="; break;
				case 3: payload += "=";  break;
			}

			var json = Encoding.UTF8.GetString(Convert.FromBase64String(payload));
			using var doc = JsonDocument.Parse(json);

			if (doc.RootElement.TryGetProperty("exp", out var expProp))
			{
				var expTime = DateTimeOffset.FromUnixTimeSeconds(expProp.GetInt64()).UtcDateTime;
				return expTime > DateTime.UtcNow;
			}
		}
		catch { /* ignore */ }

		return false;
	}
}