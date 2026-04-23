using System;
using Microsoft.Maui.Networking;

namespace AudioGo.Helpers
{
    public static class NetworkHelper
    {
        public static bool HasInternet()
        {
            try
            {
                var access = Connectivity.Current.NetworkAccess;
                return access == NetworkAccess.Internet || access == NetworkAccess.ConstrainedInternet;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[NetworkHelper] Error checking network access: {ex.Message}");
                // Fallback to true so we let HTTP timeouts handle offline cases rather than abruptly breaking
                // the flow for devices where MAUI occasionally throws exceptions for NetworkAccess
                return true; 
            }
        }
    }
}
