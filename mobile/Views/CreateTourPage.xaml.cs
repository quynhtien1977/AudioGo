using AudioGo.ViewModels;

namespace AudioGo_Mobile.Views;

public partial class CreateTourPage : ContentPage
{
    private readonly CreateTourViewModel _vm;

    public CreateTourPage(CreateTourViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    private async void OnCancelTapped(object? sender, TappedEventArgs e)
        => await Shell.Current.GoToAsync("..");

    private async void OnAddStopTapped(object? sender, TappedEventArgs e)
    {
        // Open SearchPage in "pick-mode" to add POI to tour
        // For now invoke AddPoiCommand directly
        if (_vm.AddPoiCommand.CanExecute(null))
            _vm.AddPoiCommand.Execute(null);
    }

    private async void OnSaveClicked(object? sender, EventArgs e)
    {
        if (_vm.SaveCommand.CanExecute(null))
            _vm.SaveCommand.Execute(null);
    }
}
