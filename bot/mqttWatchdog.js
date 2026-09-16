"use strict";

/*
 * In-process MQTT watchdog for SHADOWX-BOT.
 *
 * Why this exists:
 *   fca-nx already reconnects MQTT on its own, but two independent
 *   reconnect schedulers (src/api/socket/listenMqtt.js and
 *   src/api/socket/core/connectMqtt.js) share the single
 *   `ctx._reconnectTimer` flag. When they race, one of them leaves the
 *   flag set and the other refuses to reschedule ("mqtt reconnect
 *   already scheduled"), so the socket stays dead while the process
 *   still looks perfectly alive.
 *
 * What it does (everything in-process, the bot process is never
 * restarted and process.exit is never called):
 *   1. Polls the MQTT connection state.
 *   2. When the socket is down, tears the listener down and starts it
 *      again (this also clears fca-nx's stuck reconnect timer).
 *   3. If the socket does not come back after a few attempts and a
 *      usable fallback account file is available, hands over to the
 *      existing account switch flow.
 */

const DEFAULT_CHECK_INTERVAL_MS = 15000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_GRACE_MS = 8000;
const DEFAULT_RESTART_TIMEOUT_MS = 10000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

module.exports = function startMqttWatchdog(options) {
  const {
    sessionId,
    log,
    isAlive,
    restartListen,
    hasAlternate,
    onUnrecoverable,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    graceMs = DEFAULT_GRACE_MS,
    restartTimeoutMs = DEFAULT_RESTART_TIMEOUT_MS
  } = options || {};

  if (
    typeof isAlive !== "function" ||
    typeof restartListen !== "function"
  ) {
    throw new Error("mqttWatchdog requires isAlive and restartListen functions");
  }

  let attempts = 0;
  let busy = false;
  let stopped = false;
  let timer = null;

  function currentSessionOk() {
    return (
      global.GoatBot &&
      global.GoatBot.loginSessionId === sessionId
    );
  }

  function alive() {
    try {
      return isAlive() !== false;
    } catch (_) {
      return true;
    }
  }

  function safeHasAlternate() {
    try {
      return typeof hasAlternate === "function"
        ? hasAlternate() === true
        : false;
    } catch (_) {
      return false;
    }
  }

  function stop() {
    stopped = true;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  async function recover() {
    if (stopped) {
      return;
    }

    if (!currentSessionOk()) {
      stop();
      return;
    }

    if (busy) {
      return;
    }

    if (alive()) {
      if (attempts > 0) {
        log.success("MQTT_WATCHDOG", "MQTT connection is healthy again.");
      }

      attempts = 0;
      return;
    }

    busy = true;

    try {
      attempts += 1;

      log.warn(
        "MQTT_WATCHDOG",
        `MQTT is down - reconnect attempt ${attempts}/${maxAttempts}...`
      );

      await withTimeout(
        restartListen(),
        restartTimeoutMs,
        false
      );

      await sleep(graceMs);

      if (alive()) {
        attempts = 0;

        log.success(
          "MQTT_WATCHDOG",
          "MQTT reconnected in-process."
        );

        return;
      }

      if (attempts < maxAttempts) {
        return;
      }

      if (!safeHasAlternate()) {
        log.error(
          "MQTT_WATCHDOG",
          "MQTT unrecoverable and no alternate account file is available; will keep retrying."
        );

        attempts = maxAttempts - 1;
        return;
      }

      log.warn(
        "MQTT_WATCHDOG",
        `MQTT unrecoverable after ${maxAttempts} attempts - switching account...`
      );

      stop();

      await onUnrecoverable();
    } catch (err) {
      log.error(
        "MQTT_WATCHDOG",
        `Recovery error: ${
          err && err.message ? err.message : String(err)
        }`
      );
    } finally {
      busy = false;
    }
  }

  timer = setInterval(() => {
    recover().catch(() => {});
  }, checkIntervalMs);

  return {
    stop,
    kick() {
      recover().catch(() => {});
    }
  };
};
