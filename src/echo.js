import Echo from "laravel-echo";
import Pusher from "pusher-js";

Pusher.logToConsole = true;

export function makeEcho(token) {
  window.Pusher = Pusher;

  return new Echo({
    broadcaster: "pusher",
    key: "app-key",
    cluster: "mt1",

    wsHost: "127.0.0.1",
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    enabledTransports: ["ws"],

    authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
}