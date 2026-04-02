using System.Globalization;

namespace AudioGo.Converters
{
    /// <summary>Returns <c>true</c> when the bound value is null or empty string.</summary>
    public class IsNullOrEmptyConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is null || (value is string s && string.IsNullOrEmpty(s));

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => throw new NotImplementedException();
    }

    /// <summary>Returns <c>true</c> when the bound value is NOT null.</summary>
    public class IsNotNullConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is not null;

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => throw new NotImplementedException();
    }

    /// <summary>Returns <c>true</c> when the bound string is NOT null or empty.</summary>
    public class IsNotEmptyConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is string s && !string.IsNullOrEmpty(s);

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => throw new NotImplementedException();
    }

    /// <summary>Inverts a boolean binding.</summary>
    public class InvertedBoolConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is bool b && !b;

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is bool b && !b;
    }

    /// <summary>
    /// Returns <c>int.MaxValue</c> when true (expanded), <c>4</c> when false (collapsed).
    /// Used for description expand/collapse MaxLines binding.
    /// </summary>
    public class BoolToMaxLinesConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is bool b && b ? int.MaxValue : 4;

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => throw new NotImplementedException();
    }

    /// <summary>Alias for IsNotEmptyConverter — returns true when string is not null/empty.</summary>
    public class StringNotEmptyConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
            => value is string s && !string.IsNullOrEmpty(s);

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
            => throw new NotImplementedException();
    }
}

