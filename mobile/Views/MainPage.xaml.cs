using AudioGo.ViewModels;
using Shared;

namespace AudioGo_Mobile.Views;

public partial class MainPage : ContentPage
{
    private readonly MainViewModel _vm;
    // ── FIX: guard chống gọi InitAsync nhiều lần đồng thời ──
    // Ví dụ: khi Shell preload các tab cùng lúc, mỗi OnAppearing đều trigger InitAsync
    // → race condition trên network + SQLite → ANR.
    private int _initStarted = 0; // 0 = chưa chạy, 1 = đang/đã chạy

    public MainPage(MainViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();

        // ── FIX: Dùng Dispatcher.DispatchAsync thay vì async void OnAppearing ──
        // async void block Shell navigation pipeline khi có exception.
        // Dispatcher.DispatchAsync đưa InitAsync vào message queue SAU khi
        // navigation/render hoàn tất → không ảnh hưởng transition animation.
        //
        // Interlocked.Exchange đảm bảo chỉ 1 lần init dù OnAppearing bị gọi nhiều lần
        // (ví dụ: user navigate back về Home sau khi vào PoiDetail).
        if (Interlocked.Exchange(ref _initStarted, 1) == 0)
        {
            Dispatcher.DispatchAsync(async () =>
            {
                try
                {
                    await _vm.InitAsync();
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[MainPage] OnAppearing error: {ex}");
                }
            });
        }
    }

    private async void OnViewAllPoisTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("//Search");

    private async void OnViewAllToursTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("//TourList");

    private async void OnStartTourClicked(object? sender, EventArgs e)
        => await Shell.Current.GoToAsync("//TourList");

    private void OnMiniPlayerPauseTapped(object? sender, TappedEventArgs e)
        => _vm.ToggleAudio();

    private void OnMiniPlayerCloseTapped(object? sender, TappedEventArgs e)
        => _vm.StopAudio();
}
