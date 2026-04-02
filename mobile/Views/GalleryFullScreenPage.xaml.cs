using AudioGo_Mobile.Views;

namespace AudioGo_Mobile.Views;

/// <summary>
/// Màn hình xem ảnh gallery phóng to — kiểu Google Maps.
/// Nhận danh sách URL và index ảnh đầu tiên cần hiển thị.
/// </summary>
public partial class GalleryFullScreenPage : ContentPage
{
    private readonly IList<string> _images;

    public GalleryFullScreenPage(IList<string> images, int startIndex = 0)
    {
        InitializeComponent();

        _images = images;

        // Gán source cho CarouselView + IndicatorView
        GalleryCarousel.ItemsSource    = images;
        GalleryIndicator.ItemsSource   = images;
        GalleryCarousel.IndicatorView  = GalleryIndicator;

        // Scroll đến ảnh được chọn
        if (startIndex > 0 && startIndex < images.Count)
            GalleryCarousel.Position = startIndex;

        UpdateCounter(startIndex, images.Count);

        // Cập nhật counter khi người dùng swipe
        GalleryCarousel.PositionChanged += (_, e) =>
            UpdateCounter(e.CurrentPosition, images.Count);
    }

    private void UpdateCounter(int current, int total)
    {
        CounterLabel.Text = $"{current + 1} / {total}";
    }

    private async void OnClose(object? sender, EventArgs e)
        => await Navigation.PopModalAsync(animated: true);
}
