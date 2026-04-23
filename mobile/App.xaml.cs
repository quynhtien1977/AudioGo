namespace AudioGo_Mobile;

using AudioGo_Mobile.Views;
using System.Text;
using System.Text.Json;

public partial class App : Application
{
	// Key lưu trong Preferences (sync, không cần await)
	// để CreateWindow biết ngay cần render trang nào.
	private const string SessionValidKey = "SessionValid";

	public App()
	{
		InitializeComponent();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		// Đọc Preferences synchronously — không block main thread vì là disk read nhỏ.
		// Nếu flag "SessionValid" = true → đi thẳng vào AppShell, không flash QR.
		bool hasSession = Preferences.Default.Get(SessionValidKey, false);

		Page startPage;
		if (hasSession)
		{
			// ── FIX: lấy AppShell từ DI container (Singleton) thay vì new AppShell() ──
			// new AppShell() tạo Shell ngoài DI → DataTemplate tạo Pages bằng
			// Activator.CreateInstance (không qua DI) → crash vì thiếu ViewModel injection.
			var services = activationState?.Context?.Services
				?? IPlatformApplication.Current!.Services;
			startPage = services.GetRequiredService<AppShell>();
		}
		else
		{
			var services = activationState?.Context?.Services
				?? IPlatformApplication.Current!.Services;
			startPage = new NavigationPage(services.GetRequiredService<WelcomePage>());
		}

		var window = new Window(startPage);

		// Nếu đã có session, verify token async ngay sau khi window tạo xong
		if (hasSession)
		{
			_ = Task.Run(async () =>
			{
				try
				{
					var token = await SecureStorage.GetAsync("GuestToken");
					if (string.IsNullOrEmpty(token) || !IsJwtValid(token))
					{
						// Token hết hạn → xóa flag và về trang QR
						Preferences.Default.Remove(SessionValidKey);
						SecureStorage.Remove("GuestToken");
						MainThread.BeginInvokeOnMainThread(() =>
						{
							if (Application.Current is not null)
							{
								var services = IPlatformApplication.Current!.Services;
								Application.Current.MainPage = new NavigationPage(services.GetRequiredService<WelcomePage>());
							}
						});
					}
				}
				catch (Exception ex)
				{
					System.Diagnostics.Debug.WriteLine($"[App] Token verify error: {ex.Message}");
					// SecureStorage crash trên một số device khi không có USB
					// → xóa session, để user scan QR lại
					Preferences.Default.Remove(SessionValidKey);
					MainThread.BeginInvokeOnMainThread(() =>
					{
						if (Application.Current is not null)
						{
							var services = IPlatformApplication.Current!.Services;
							Application.Current.MainPage = new NavigationPage(services.GetRequiredService<WelcomePage>());
						}
					});
				}
			});
		}

		return window;
	}

	/// <summary>
	/// Đánh dấu session hợp lệ để lần sau CreateWindow dùng được.
	/// Gọi từ WelcomeQrScanViewModel sau khi scan thành công.
	/// </summary>
	public static void MarkSessionValid() =>
		Preferences.Default.Set(SessionValidKey, true);

	/// <summary>
	/// Xóa flag session (logout / token expire).
	/// </summary>
	public static void ClearSession()
	{
		Preferences.Default.Remove(SessionValidKey);
		SecureStorage.Remove("GuestToken");
	}

	/// <summary>
	/// Gọi khi app quay lại foreground từ background.
	/// Trigger retry download các file audio/logo/gallery còn thiếu.
	/// </summary>
	protected override void OnResume()
	{
		base.OnResume();

		// Chỉ retry nếu đang có mạng và session hợp lệ
		if (!AudioGo.Helpers.NetworkHelper.HasInternet()) return;
		if (!Preferences.Default.Get(SessionValidKey, false)) return;

		var syncService = IPlatformApplication.Current?.Services
			?.GetService<AudioGo.Services.SyncService>();

		if (syncService is not null)
		{
			_ = Task.Run(async () =>
			{
				try
				{
					System.Diagnostics.Debug.WriteLine("[App] OnResume — retrying pending downloads");
					await syncService.RetryPendingDownloadsAsync();
				}
				catch (Exception ex)
				{
					System.Diagnostics.Debug.WriteLine($"[App] OnResume retry error: {ex.Message}");
				}
			});
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