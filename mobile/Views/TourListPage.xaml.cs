using AudioGo.ViewModels;
using Shared;

namespace AudioGo_Mobile.Views;

public partial class TourListPage : ContentPage
{
    private readonly TourListViewModel _vm;

    public TourListPage(TourListViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.LoadToursAsync();
    }

    private async void OnCreateTourClicked(object? sender, EventArgs e)
        => await Shell.Current.GoToAsync(nameof(CreateTourPage));

    private async void OnTourMenuTapped(object? sender, TappedEventArgs e)
    {
        if (e.Parameter is not Shared.DTOs.TourSummaryDto tour) return;
        var action = await DisplayActionSheet(
            tour.Name, "Hủy", null,
            "Xem chi tiết", "Chỉnh sửa", "Xóa");
        if (action == "Xem chi tiết")
            await Shell.Current.GoToAsync($"{nameof(TourDetailPage)}?tourId={tour.TourId}");
        else if (action == "Xóa")
            await _vm.DeleteTourAsync(tour.TourId);
    }
}
