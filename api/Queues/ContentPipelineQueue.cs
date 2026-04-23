using System.Threading.Channels;

namespace Server.Queues
{
    public interface IContentPipelineQueue
    {
        ValueTask QueuePoiIdAsync(string poiId);
        ValueTask<string> ReadAsync(CancellationToken cancellationToken);
    }

    public class ContentPipelineQueue : IContentPipelineQueue
    {
        private readonly Channel<string> _queue;

        public ContentPipelineQueue(int capacity = 100)
        {
            var options = new BoundedChannelOptions(capacity)
            {
                FullMode = BoundedChannelFullMode.Wait
            };
            _queue = Channel.CreateBounded<string>(options);
        }

        public async ValueTask QueuePoiIdAsync(string poiId)
        {
            await _queue.Writer.WriteAsync(poiId);
        }

        public ValueTask<string> ReadAsync(CancellationToken cancellationToken)
        {
            return _queue.Reader.ReadAsync(cancellationToken);
        }
    }
}
