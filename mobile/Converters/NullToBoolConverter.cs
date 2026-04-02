using System.Globalization;

namespace AudioGo_Mobile.Converters;

/// <summary>
/// Converts a string/object to bool:
///   - Null or empty string → false
///   - Non-null, non-empty  → true
/// Pass ConverterParameter="inverse" to flip the result.
/// Use case: IsVisible binding on Image (true when URL exists) + fallback Label (inverse).
/// </summary>
public class NullToBoolConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        bool hasValue = value is string s
            ? !string.IsNullOrWhiteSpace(s)
            : value is not null;

        bool inverse = parameter is string p && p.Equals("inverse", StringComparison.OrdinalIgnoreCase);
        return inverse ? !hasValue : hasValue;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotImplementedException();
}
