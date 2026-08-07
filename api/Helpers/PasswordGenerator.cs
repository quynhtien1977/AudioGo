using System.Security.Cryptography;

namespace Server.Helpers
{
    /// <summary>
    /// Sinh mật khẩu ngẫu nhiên crypto-safe.
    /// Đảm bảo có đủ 4 loại ký tự: chữ hoa, chữ thường, số, ký tự đặc biệt.
    /// </summary>
    public static class PasswordGenerator
    {
        private const string UpperCase  = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // bỏ I, O để tránh nhầm
        private const string LowerCase  = "abcdefghjkmnpqrstuvwxyz";    // bỏ i, l, o
        private const string Digits     = "23456789";                    // bỏ 0, 1
        private const string Specials   = "@#$%&*!?";
        private const string AllChars   = UpperCase + LowerCase + Digits + Specials;

        /// <summary>
        /// Sinh mật khẩu ngẫu nhiên độ dài 10–12 ký tự,
        /// bắt buộc có ít nhất 1 ký tự mỗi loại.
        /// </summary>
        public static string Generate(int length = 10)
        {
            if (length < 8) length = 10;

            var buffer = new byte[length + 4];
            RandomNumberGenerator.Fill(buffer);

            // Đảm bảo bắt buộc có mỗi loại ký tự ít nhất 1
            var mandatory = new char[]
            {
                UpperCase [buffer[length]     % UpperCase.Length],
                LowerCase [buffer[length + 1] % LowerCase.Length],
                Digits    [buffer[length + 2] % Digits.Length],
                Specials  [buffer[length + 3] % Specials.Length],
            };

            // Điền phần còn lại bằng ký tự ngẫu nhiên từ AllChars
            var chars = new char[length];
            for (int i = 0; i < length - 4; i++)
            {
                var randomByte = buffer[i];
                chars[i] = AllChars[randomByte % AllChars.Length];
            }

            // Đặt 4 ký tự bắt buộc vào cuối
            chars[length - 4] = mandatory[0];
            chars[length - 3] = mandatory[1];
            chars[length - 2] = mandatory[2];
            chars[length - 1] = mandatory[3];

            // Shuffle để các ký tự bắt buộc không luôn ở cuối
            Shuffle(chars);

            return new string(chars);
        }

        private static void Shuffle(char[] array)
        {
            var swapBytes = new byte[array.Length];
            RandomNumberGenerator.Fill(swapBytes);

            for (int i = array.Length - 1; i > 0; i--)
            {
                int j = swapBytes[i] % (i + 1);
                (array[i], array[j]) = (array[j], array[i]);
            }
        }
    }
}
