using System;
using System.Collections.Generic;
using AudioGo.Helpers;

namespace AudioGo.Services.Interfaces
{
    public interface ITourSessionManager
    {
        TourSession? ActiveSession { get; }
        bool IsActive { get; }

        void StartSession(string tourId, List<string> orderedPoiIds);
        void EndSession();
        void ResetSession();

        event EventHandler<string>? PoiVisited;   // poiId
        event EventHandler? SessionCompleted;
    }
}
