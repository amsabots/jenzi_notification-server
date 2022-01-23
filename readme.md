# Server notification system

This system is built to handle realtime data transfer between two connected users via a channel subscription system

#### Composition

- RabbitMQ server - a queue system that receives payload from either a service running in the same system or via a URL call to the specified endpoint
- Pusher JS Nodejs dependency

### Exposed endpoint

```js
protocal: server_host: 27500 / realtime / handle - service - request;
//for example
localhost: 27500 / realtime / handle - service - request;
```

Make sure to append the TCP protocol when making a URL request

### Data payload format

```json
{
  "payload": {},
  "sourceAddress": "andrewmwebi",
  "destinationAddress": "lameckowesi",
  "filterType": "request_user"
}
```

> > **Please note:** The payload sent over the UTL should be a POST calll and should strictly follow the format shown above
