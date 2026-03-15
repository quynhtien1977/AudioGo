using ZXing.Net.Maui;

namespace AudioGo_Mobile.Views;

public partial class QrScanPage : ContentPage
{
    private bool _navigating;

    public QrScanPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _navigating = false;
        BarcodeReader.IsDetecting = true;
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        BarcodeReader.IsDetecting = false;
    }

    private void OnBarcodesDetected(object? sender, BarcodeDetectionEventArgs e)
    {
        // Chỉ xử lý lần đầu tiên để tránh nhiều lần navigate
        if (_navigating) return;

        var first = e.Results.FirstOrDefault();
        if (first is null) return;

        var raw = first.Value;
        if (string.IsNullOrWhiteSpace(raw)) return;

        _navigating = true;

        // Hỗ trợ cả 2 format:
        //   audiogo://poi/{poiId}
        //   {poiId}  (plain text)
        var poiId = raw.StartsWith("audiogo://poi/", StringComparison.OrdinalIgnoreCase)
            ? raw["audiogo://poi/".Length..]
            : raw;

        MainThread.BeginInvokeOnMainThread(async () =>
        {
            await Shell.Current.GoToAsync($"../{nameof(PoiDetailPage)}?poiId={Uri.EscapeDataString(poiId)}");
        });
    }

    private async void OnCancelClicked(object? sender, EventArgs e)
    {
        await Shell.Current.GoToAsync("..");
    }
}
