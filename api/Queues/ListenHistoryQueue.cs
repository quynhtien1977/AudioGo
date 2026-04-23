using System.Threading.Channels;
using Server.Models;

namespace Server.Queues
{
    public interface IListenHistoryQueue
    {
        ValueTask QueueListenHistoryAsync(ListenHistory listenHistory);
        ValueTask<ListenHistory> ReadAsync(CancellationToken cancellationToken);
    }

    public class ListenHistoryQueue : IListenHistoryQueue
    {
        private readonly Channel<ListenHistory> _queue;

        public ListenHistoryQueue(int capacity = 2000)
        {
            var options = new BoundedChannelOptions(capacity)
            {
                FullMode = BoundedChannelFullMode.Wait
            };
            _queue = Channel.CreateBounded<ListenHistory>(options);
        }

        public async ValueTask QueueListenHistoryAsync(ListenHistory listenHistory)
        {
            await _queue.Writer.WriteAsync(listenHistory);
        }

        public ValueTask<ListenHistory> ReadAsync(CancellationToken cancellationToken)
        {
            return _queue.Reader.ReadAsync(cancellationToken);
        }
    }
}
