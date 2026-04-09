using AudioGo.ViewModels;
using Shared;

namespace AudioGo_Mobile.Views;

public partial class MainPage : ContentPage
{
    private readonly MainViewModel _vm;

    public MainPage(MainViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.InitAsync();
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
