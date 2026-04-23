using System.Threading.Channels;
using Server.Models;

namespace Server.Queues
{
    public interface ILocationQueue
    {
        ValueTask QueueLocationAsync(LocationLog locationLog);
        ValueTask<LocationLog> ReadAsync(CancellationToken cancellationToken);
    }

    public class LocationQueue : ILocationQueue
    {
        private readonly Channel<LocationLog> _queue;

        public LocationQueue(int capacity = 5000)
        {
            var options = new BoundedChannelOptions(capacity)
            {
                FullMode = BoundedChannelFullMode.Wait
            };
            _queue = Channel.CreateBounded<LocationLog>(options);
        }

        public async ValueTask QueueLocationAsync(LocationLog locationLog)
        {
            await _queue.Writer.WriteAsync(locationLog);
        }

        public ValueTask<LocationLog> ReadAsync(CancellationToken cancellationToken)
        {
            return _queue.Reader.ReadAsync(cancellationToken);
        }
    }
}
