using AudioGo.ViewModels;

namespace AudioGo_Mobile.Views;

public partial class SearchPage : ContentPage
{
    private readonly SearchViewModel _vm;

    public SearchPage(SearchViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
    }

    private void OnSearchTextChanged(object? sender, TextChangedEventArgs e)
    {
        _vm.Query = e.NewTextValue ?? string.Empty;
    }

    private async void OnMapViewTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("//Map");
}
