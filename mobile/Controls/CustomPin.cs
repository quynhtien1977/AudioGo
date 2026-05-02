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

    /// <summary>
    /// Số thứ tự hiển thị trực tiếp trên pin (dùng cho mini map của tour).
    /// 0 = không hiển thị số (dùng logo bình thường).
    /// </summary>
    public static readonly BindableProperty StepNumberProperty = BindableProperty.Create(
        nameof(StepNumber), typeof(int), typeof(CustomPin), defaultValue: 0);

    public int StepNumber
    {
        get => (int)GetValue(StepNumberProperty);
        set => SetValue(StepNumberProperty, value);
    }

    public string PoiId { get; set; } = string.Empty;

    public event Action? ImageUrlChanged;

    private void OnImageUrlChanged()
    {
        ImageUrlChanged?.Invoke();
    }
}
