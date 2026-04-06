using Microsoft.Maui.Controls.Maps;
using System.ComponentModel;

namespace AudioGo.Controls;

public class CustomPin : Pin, INotifyPropertyChanged
{
    public static readonly BindableProperty ImageUrlProperty = BindableProperty.Create(
        nameof(ImageUrl),
        typeof(string),
        typeof(CustomPin),
        propertyChanged: (b, o, n) => ((CustomPin)b).OnImageUrlChanged());

    public string ImageUrl
    {
        get => (string)GetValue(ImageUrlProperty);
        set => SetValue(ImageUrlProperty, value);
    }

    public string PoiId { get; set; } = string.Empty;

    public event Action? ImageUrlChanged;

    private void OnImageUrlChanged()
    {
        ImageUrlChanged?.Invoke();
    }
}
