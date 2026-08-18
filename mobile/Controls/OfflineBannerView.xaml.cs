using AudioGo.Helpers;
using Microsoft.Maui.Networking;

namespace AudioGo_Mobile.Controls;

public partial class OfflineBannerView : ContentView
{
    private bool _dismissed = false;

    public OfflineBannerView()
    {
        InitializeComponent();

        // Set translated text at runtime (TranslateExtension runs at XAML parse time
        // before the language might be set, so we set it here to be safe).
        MessageLabel.Text = AppStrings.Get("offline_banner_msg");

        // Listen for connectivity changes
        Connectivity.Current.ConnectivityChanged += OnConnectivityChanged;

        // Check current state immediately
        UpdateVisibility();
    }

    // ── Connectivity change handler ─────────────────────────────────────────
    private void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            // When connection is restored, re-enable the banner for next drop
            if (e.NetworkAccess == NetworkAccess.Internet ||
                e.NetworkAccess == NetworkAccess.ConstrainedInternet)
            {
                _dismissed = false;       // Reset dismiss so next offline shows again
                IsVisible = false;
            }
            else
            {
                UpdateVisibility();
            }
        });
    }

    private void UpdateVisibility()
    {
        var access = Connectivity.Current.NetworkAccess;
        bool isOffline = access != NetworkAccess.Internet &&
                         access != NetworkAccess.ConstrainedInternet;

        if (isOffline && !_dismissed)
        {
            MessageLabel.Text = AppStrings.Get("offline_banner_msg");
            IsVisible = true;
        }
        else
        {
            IsVisible = false;
        }
    }

    // ── Dismiss button ──────────────────────────────────────────────────────
    private void OnDismissTapped(object? sender, TappedEventArgs e)
    {
        _dismissed = true;
        IsVisible = false;
    }

    // ── Cleanup ─────────────────────────────────────────────────────────────
    ~OfflineBannerView()
    {
        try { Connectivity.Current.ConnectivityChanged -= OnConnectivityChanged; }
        catch { /* ignore */ }
    }
}
