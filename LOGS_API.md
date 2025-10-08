# Logs API Endpoint

## Overview

The Logs API provides a stateless, in-memory logging solution that allows you to retrieve application logs without database persistence. Logs are stored in a circular buffer in memory and can be queried via HTTP API.

## Key Features

- **Stateless**: No database storage - logs exist only in memory
- **Circular Buffer**: Automatically maintains the last 1000 log entries
- **Real-time**: Captures all application logs as they occur
- **Filterable**: Query logs by level, time range, and limit
- **Stats**: Get buffer statistics and log level distribution

## Endpoint

```
GET /api/v1/public/logs
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Maximum number of logs to return (max: 1000) |
| `level` | string | all | Filter by log level: `info`, `warn`, `error`, `debug` |
| `since` | string | all | ISO timestamp to filter logs from (e.g., `2025-10-07T12:00:00Z`) |

## Response Format

```json
{
  "success": true,
  "message": "Logs retrieved successfully",
  "data": {
    "logs": [
      {
        "level": "info",
        "time": "2025-10-07T12:00:00.000Z",
        "msg": "Server started successfully",
        "function": "startServer",
        "module": "server",
        "port": 3000
      }
    ],
    "stats": {
      "totalLogs": 156,
      "maxCapacity": 1000,
      "levels": {
        "info": 120,
        "warn": 25,
        "error": 11
      },
      "oldestLog": "2025-10-07T11:45:00.000Z",
      "newestLog": "2025-10-07T12:15:00.000Z"
    },
    "query": {
      "limit": 100,
      "level": "all",
      "since": "all"
    }
  }
}
```

## Usage Examples

### Get the last 100 logs (default)
```bash
curl http://localhost:3000/api/v1/public/logs
```

### Get the last 50 logs
```bash
curl "http://localhost:3000/api/v1/public/logs?limit=50"
```

### Get only error logs
```bash
curl "http://localhost:3000/api/v1/public/logs?level=error"
```

### Get logs since a specific timestamp
```bash
curl "http://localhost:3000/api/v1/public/logs?since=2025-10-07T12:00:00Z"
```

### Combine filters
```bash
curl "http://localhost:3000/api/v1/public/logs?level=error&limit=20&since=2025-10-07T12:00:00Z"
```

## Implementation Details

### Circular Buffer
- The buffer maintains a maximum of **1000 log entries**
- When the buffer is full, the oldest log is automatically removed
- This ensures constant memory usage regardless of application runtime

### Memory Considerations
- Each log entry is a JSON object (~200-500 bytes on average)
- Total memory usage: ~100-500 KB for 1000 logs
- Logs are cleared when the application restarts

### Log Levels
- `debug`: Detailed debugging information
- `info`: General informational messages
- `warn`: Warning messages that don't stop execution
- `error`: Error messages indicating failures

## Integration with Frontend

### React/TypeScript Example
```typescript
interface LogEntry {
  level: string;
  time: string;
  msg: string;
  [key: string]: any;
}

interface LogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: LogEntry[];
    stats: {
      totalLogs: number;
      maxCapacity: number;
      levels: Record<string, number>;
      oldestLog: string | null;
      newestLog: string | null;
    };
  };
}

async function fetchLogs(
  limit = 100,
  level?: string,
  since?: string
): Promise<LogsResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (level) params.append('level', level);
  if (since) params.append('since', since);
  
  const response = await fetch(
    `http://localhost:3000/api/v1/public/logs?${params}`
  );
  return response.json();
}

// Usage
const logs = await fetchLogs(50, 'error');
console.log(logs.data.logs);
```

### JavaScript Example
```javascript
// Get all recent logs
fetch('http://localhost:3000/api/v1/public/logs')
  .then(res => res.json())
  .then(data => console.log(data.data.logs));

// Get error logs only
fetch('http://localhost:3000/api/v1/public/logs?level=error')
  .then(res => res.json())
  .then(data => console.log(data.data.logs));
```

## Monitoring and Debugging

### Real-time Log Viewer
You can build a real-time log viewer by polling this endpoint:

```typescript
// Poll for new logs every 5 seconds
setInterval(async () => {
  const lastLogTime = getLastLogTimestamp(); // Your logic
  const logs = await fetchLogs(100, undefined, lastLogTime);
  updateLogViewer(logs.data.logs);
}, 5000);
```

### Log Analytics
Use the stats object to build dashboards:

```typescript
const { stats } = await fetchLogs();
console.log(`Total logs: ${stats.totalLogs}/${stats.maxCapacity}`);
console.log(`Error rate: ${stats.levels.error / stats.totalLogs * 100}%`);
```

## Best Practices

1. **Pagination**: Use the `limit` parameter to avoid large payloads
2. **Time-based filtering**: Use `since` for incremental fetching
3. **Level filtering**: Use `level` to focus on specific log types
4. **Polling interval**: Don't poll too frequently; 5-10 seconds is reasonable
5. **Local caching**: Cache logs in your frontend to reduce API calls

## Limitations

- **Memory-only**: Logs are lost on application restart
- **Capacity**: Only the last 1000 logs are retained
- **No persistence**: For long-term storage, use dedicated logging services
- **No search**: Full-text search is not supported (use external log aggregation)

## Security Considerations

- This endpoint is **public** and doesn't require authentication
- Consider adding authentication if logs contain sensitive information
- Monitor usage to prevent abuse
- Implement rate limiting if necessary

## Future Enhancements

Possible improvements for production use:
- Add authentication/authorization
- Support for log export (JSON, CSV)
- WebSocket support for real-time streaming
- Full-text search capabilities
- Integration with log aggregation services (Datadog, New Relic, etc.)

